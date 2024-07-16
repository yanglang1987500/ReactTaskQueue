import { useEffect } from "react";

import { useQueue } from "./taskQueue/useTaskQueue";

const NotificationCenterImplement = () => {
  // const taskA = useTaskA()
  // const taskB = useTaskB()
  // const taskC = useTaskC()
  const queue = useQueue([
    // taskA,
    // taskB
    // taskC,
  ]);
  useEffect(() => {
    queue();
  }, [queue]);
  return null;
};

export default NotificationCenterImplement;
