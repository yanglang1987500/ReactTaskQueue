import { NOTIFICATION_CENTER_TASKS } from "../constants";
import { useTask } from "./useTaskQueue";

export const useTaskB = () => {
  const { notify, getI18n, t, dexHost } = useNotificationCenter();
  const unstakeImmediately = useMemo(
    () => !isServer && getQueryString("unstake") === "true",
    []
  );
  const getButtons = useButtons();
  const isLogin = useIsLogin();
  const lng: string = useLng();
  const { summary, done } = useStakingSummary();
  const { userAmount = "0" } = summary;

  const showCondition = useMemo(
    () => Number(userAmount) > 0 && !unstakeImmediately,
    [userAmount, unstakeImmediately]
  );
  const doReplaceUrl = useCallback(
    (url: string, args: Record<string, string | number> = {}) =>
      replaceUrl(url, { origin: dexHost, locale: lng, ...args }),
    [lng, dexHost]
  );
  const gotoDao = useCallback(() => {
    window.location.href = doReplaceUrl("%origin%/%locale%/governance");
  }, [doReplaceUrl]);
  const gotoStaking = useCallback(() => {
    window.location.href = doReplaceUrl(
      "%origin%/%locale%/staking?unstake=true"
    );
  }, [doReplaceUrl]);
  const job = useCallback<TaskCallback>(
    async ({ resolve, abort, index, total }) => {
      if (!showCondition) return resolve();
      notify({
        header: <Text sx={{ mr: "20px" }}>Task B</Text>,
        message: (
          <Box sx={{ overflow: "hidden" }}>
            <CustomText
              variant="body2"
              color="t.secondary"
              sx={{ lineHeight: "22px" }}
            ></CustomText>
          </Box>
        ),
        onClose: () => abort(),
        persist: true,
        showProgress: true,
      });
    },
    [notify, getI18n, showCondition, gotoDao, gotoStaking]
  );
  return useTask(
    NOTIFICATION_CENTER_TASKS.TASK_B,
    job,
    !isLogin || !done,
    !showCondition
  );
};
