
export interface ContextModel {
  notify: (item: Partial<NotificationItemProps>) => void
  getI18n: IGetI18n
  t: TFunction<string>
  dexHost: string
}
export const Context = createContext<ContextModel>({} as ContextModel)

export const useNotificationCenter = () => useContext(Context)
