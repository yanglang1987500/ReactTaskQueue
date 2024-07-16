type AnchorOrigin = {
  horizontal: "left" | "center" | "right";
  vertical: "top" | "bottom";
};

export type Props = {
  getI18n: IGetI18n;
  dexHost: string;
  t: TFunction<string>;
  anchorOrigin?: AnchorOrigin;
};

type HandlerMap = Record<string, boolean>;

const NotificationCenter = (props: Props) => {
  const {
    getI18n,
    t,
    dexHost,
    anchorOrigin = { horizontal: "right", vertical: "top" },
  } = props;
  const handlerRef = useRef<HandlerMap>({});
  const { enqueueNotification, updateNotification } = useNotification();
  const defaultConfig = useMemo(
    () =>
      ({
        key: ENQUEUE_NOTIFICATION_PERSIST_KEY,
        anchorOrigin,
        variant: "tips",
        icon: <MailIcon color="t.primary" />,
        sx: { maxHeight: "unset", width: "360px" },
      } as NotificationItemProps),
    [anchorOrigin]
  );
  const value = useMemo(
    () => ({
      notify: (item: NotificationItemProps) => {
        const { key = defaultConfig.key } = item;
        if (handlerRef.current[key]) {
          updateNotification(key, { ...defaultConfig, ...item });
        } else {
          enqueueNotification({ ...defaultConfig, ...item });
          handlerRef.current[key] = true;
        }
      },
      getI18n,
      t,
      dexHost,
    }),
    [
      enqueueNotification,
      updateNotification,
      defaultConfig,
      getI18n,
      t,
      dexHost,
    ]
  );
  return (
    <Context.Provider value={value}>
      <ReactQueryContainer>
        <NotificationCenterImplement />
      </ReactQueryContainer>
    </Context.Provider>
  );
};

export default NotificationCenter;
