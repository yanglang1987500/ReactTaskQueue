import { NOTIFICATION_CENTER_TASKS } from "../constants";
import { useTask } from "./useTaskQueue";

export const useTaskC = () => {
  const { notify, getI18n, t, dexHost } = useNotificationCenter();
  const getButtons = useButtons();
  const isLogin = useIsLogin();
  const lng: string = useLng();
  const { rewardsAPX, isLoading } = useStakingRewards();
  const { totalNoneCoolingOffAmt: apxTotalNoneCoolingOffAmt = 0 } = rewardsAPX;
  const apxRewards = Number(apxTotalNoneCoolingOffAmt);

  const showCondition = useMemo(
    () =>
      Number(apxRewards) > 0 &&
      storage.getItem(APX_REWARDS_UNCLAIM_NOT_SHOW, false, true) !== "true" &&
      !storage.getExpireItem(APX_REWARDS_UNCLAIM_NOT_SHOW_24HOURS, false),
    [apxRewards]
  );
  const doReplaceUrl = useCallback(
    (url: string, args: Record<string, string | number> = {}) =>
      replaceUrl(url, { origin: dexHost, locale: lng, ...args }),
    [lng, dexHost]
  );
  const gotoTradeRewards = useCallback(() => {
    window.location.href = doReplaceUrl("%origin%/%locale%/trade-rewards");
  }, [doReplaceUrl]);
  const job = useCallback<TaskCallback>(
    async ({ resolve, abort, index, total }) => {
      if (!showCondition) return resolve();
      storage.setExpireItem(APX_REWARDS_UNCLAIM_NOT_SHOW_24HOURS, true, {
        ttl: 24 * 60 * 60 * 1000,
      });
      notify({
        header: <Text sx={{ mr: "20px" }}>Task C</Text>,
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
    [notify, getI18n, showCondition, gotoTradeRewards]
  );
  return useTask(
    NOTIFICATION_CENTER_TASKS.TASK_C,
    job,
    !isLogin || isLoading,
    !showCondition
  );
};
