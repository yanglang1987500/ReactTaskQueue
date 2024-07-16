import { NOTIFICATION_CENTER_TASKS } from "../constants";
import { TaskCallback, useTask } from "./useTaskQueue";

export const VAULT_EXPIRE_NOT_SHOW = "VAULT_EXPIRE_NOT_SHOW";

export const useTaskA = () => {
  const { notify, getI18n, dexHost } = useNotificationCenter();
  const getButtons = useButtons();
  const isLogin = useIsLogin();
  const lng: string = useLng();
  const { data: aboutToExpireTokens, done } = useVaultTokensAboutExpired();
  const { isWebNotificationActive, isFetched: userPreferenceDone } =
    useUserDaoWebNotification();
  const aboutToExpireTomorrowTokens = useMemo(
    () => aboutToExpireTokens.filter((i) => i.expireTomorrow),
    [aboutToExpireTokens]
  );
  const aboutToExpire2Or3DaysTokens = useMemo(
    () => aboutToExpireTokens.filter((i) => !i.expireTomorrow),
    [aboutToExpireTokens]
  );
  const showCondition = useMemo(
    () =>
      aboutToExpireTokens.length > 0 &&
      storage.getItem(VAULT_EXPIRE_NOT_SHOW, false, true) !== "true" &&
      isWebNotificationActive,
    [aboutToExpireTokens, isWebNotificationActive]
  );
  const doReplaceUrl = useCallback(
    (url: string, args: Record<string, string | number> = {}) =>
      replaceUrl(url, { origin: dexHost, locale: lng, ...args }),
    [lng, dexHost]
  );
  const gotoDao = useCallback(() => {
    window.location.href = doReplaceUrl("%origin%/%locale%/governance/vault");
  }, [doReplaceUrl]);
  const job = useCallback<TaskCallback>(
    async ({ resolve, abort, index, total }) => {
      if (!showCondition) return resolve();
      notify({
        header: <Text>Task A</Text>,
        message: (
          <Box
            sx={{
              overflow: "hidden",
              ".label-white": {
                userSelect: "none",
                "input:checked ~ svg": {
                  fill: "t.white",
                },
              },
            }}
          ></Box>
        ),
        onClose: () => abort(),
        persist: true,
        showProgress: true,
      });
    },
    [
      showCondition,
      notify,
      getI18n,
      aboutToExpireTomorrowTokens,
      aboutToExpire2Or3DaysTokens,
      getButtons,
      gotoDao,
    ]
  );
  return useTask(
    NOTIFICATION_CENTER_TASKS.TASK_A,
    job,
    !isLogin || !done || !userPreferenceDone,
    !showCondition
  );
};
