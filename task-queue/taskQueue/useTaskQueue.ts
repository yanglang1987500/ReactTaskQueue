/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-shadow */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom'

export enum DeferredStatus {
  pending = 1,
  rejected = 2,
  fulfilled = 3,
  pause = 4,
}
export class Deferred<T> {
  promise: Promise<T>

  status: DeferredStatus = DeferredStatus.pending

  resolve!: (value: T | PromiseLike<T>) => void

  reject!: (reason?: any) => void

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (...rest) => {
        resolve(...rest)
        this.status = DeferredStatus.fulfilled
      }
      this.reject = (...rest) => {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(...rest)
        this.status = DeferredStatus.rejected
      }
    })
  }

  pause() {
    this.status = DeferredStatus.pause
  }
}

const NOT_START_INDEX = -1

enum TaskResult {
  Continue = 1,
  Abort = 2,
  Previous = 3,
  JumpTo = 4,
}

type TaskJobResolver = {
  type: TaskResult
  params?: Record<string, any>
}

export interface Task {
  name: string
  job: (jobData: Record<string, any>, index: number, total: number) => Promise<TaskJobResolver>
  isPause: boolean
  isSkip?: boolean
}

export type TaskCallback = (option: {
  resolve: () => void
  reject: (reason?: any) => void
  abort: () => void
  back: () => void
  jumpTo: (name: string) => void
  jobData: Record<string, any>
  index: number
  total: number
}) => void

export function useTask(name: string, callback: TaskCallback, isPause: boolean, isSkip?: boolean): Task {
  return useMemo(
    () => ({
      job: (jobData: Record<string, any>, index: number, total: number) =>
        new Promise((resolve, reject) => {
          callback({
            resolve: () =>
              resolve({
                type: TaskResult.Continue,
              }),
            reject,
            abort: () =>
              resolve({
                type: TaskResult.Abort,
              }),
            back: () =>
              resolve({
                type: TaskResult.Previous,
              }),
            jumpTo: (name: string) =>
              resolve({
                type: TaskResult.JumpTo,
                params: {
                  name,
                },
              }),
            jobData,
            index,
            total,
          })
        }),
      name,
      isPause,
      isSkip,
    }),
    [name, callback, isPause, isSkip],
  )
}

export const useQueue = (_tasks: Task[]) => {
  const taskWithSkipCheck = useMemo(() => _tasks.filter(task => typeof task.isSkip !== 'undefined'), [_tasks])
  const existTaskSkip = taskWithSkipCheck.length > 0
  const [tasksReady, setTasksReady] = useState(!existTaskSkip)
  const skipTaskNamesRef = useRef<string[]>([])
  const tasks = _tasks.filter(task => !skipTaskNamesRef.current.includes(task.name))
  const deferred = useRef(new Deferred<void>())
  const executeIndex = useRef(NOT_START_INDEX)
  const [nextExecuteIndex, setNextExecuteIndex] = useState(NOT_START_INDEX)
  const jobData = useRef({})
  const reset = useCallback(() => {
    executeIndex.current = NOT_START_INDEX
    setNextExecuteIndex(NOT_START_INDEX)
    deferred.current = new Deferred()
    jobData.current = {}
  }, [])
  useEffect(() => {
    if (!tasksReady && existTaskSkip && taskWithSkipCheck.every(task => !task.isPause)) {
      const needSkipTaskNames = taskWithSkipCheck.filter(task => task.isSkip).map(task => task.name)
      unstable_batchedUpdates(() => {
        skipTaskNamesRef.current = needSkipTaskNames
        setTasksReady(true)
      })
    }
  }, [existTaskSkip, taskWithSkipCheck])
  useEffect(() => {
    async function execute(index) {
      try {
        const task = tasks[index]
        if (task.isPause) {
          // console.log('task queue is pause by', task.name, 'wait for continue')
          return deferred.current.pause()
        }
        // console.log('start to run task:', task.name)
        const { type: taskResult, params } = await task.job(jobData.current, index, tasks.length)
        // if index === 0 , call back() will continue task queue
        if (taskResult === TaskResult.Previous && index > 0) {
          setNextExecuteIndex(index - 1)
          return
        }
        if (taskResult === TaskResult.JumpTo && params?.name) {
          const jumpToIndex = tasks.findIndex(task => task.name === params.name)
          // if name not given, or can not find task by given name, task queue will continue
          if (jumpToIndex !== -1) {
            setNextExecuteIndex(jumpToIndex)
            return
          }
        }
        if (taskResult === TaskResult.Abort) {
          deferred.current.resolve()
          reset()
          return
        }
        if (index + 1 < tasks.length) {
          setNextExecuteIndex(index + 1)
        } else {
          // logger('all tast complete')
          deferred.current.resolve()
          reset()
        }
      } catch (e) {
        deferred.current.reject(e)
        reset()
      }
    }
    if (
      nextExecuteIndex >= 0 &&
      nextExecuteIndex < tasks.length &&
      (nextExecuteIndex !== executeIndex.current || deferred.current.status === DeferredStatus.pause) &&
      ![DeferredStatus.rejected, DeferredStatus.fulfilled].includes(deferred.current.status) &&
      tasksReady
    ) {
      if (deferred.current.status === DeferredStatus.pause) {
        deferred.current.status = DeferredStatus.pending
      }
      execute(nextExecuteIndex)
      executeIndex.current = nextExecuteIndex
    }
  }, [nextExecuteIndex, tasks, reset, tasksReady])

  return useCallback(
    (index = 0) => {
      reset()
      setTimeout(() => {
        setNextExecuteIndex(index)
      })
      return deferred.current.promise
    },
    [reset],
  )
}
