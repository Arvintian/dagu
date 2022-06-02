import { Button, IconButton, Stack } from "@mui/material";
import React, { ReactElement } from "react";
import { SchedulerStatus, Status } from "../models/Status";

type Props = {
  status?: Status;
  group: string;
  name: string;
  label?: boolean;
  refresh?: () => any;
};

function WorkflowActions({
  status,
  group,
  name,
  refresh = () => {},
  label = true,
}: Props) {
  const onSubmit = React.useCallback(
    async (
      warn: string,
      params: {
        group: string;
        name: string;
        action: string;
        requestId?: string;
      }
    ) => {
      if (!confirm(warn)) {
        return;
      }
      const form = new FormData();
      form.set("group", params.group);
      form.set("action", params.action);
      if (params.requestId) {
        form.set("request-id", params.requestId);
      }
      const url = `${API_URL}/dags/${params.name}`;
      const ret = await fetch(url, {
        method: "POST",
        mode: "cors",
        body: form,
      });
      if (ret.ok) {
        refresh();
      } else {
        const e = await ret.text();
        alert(e);
      }
    },
    [refresh]
  );
  const buttonState = React.useMemo(
    () => ({
      start: status?.Status != SchedulerStatus.Running,
      stop: status?.Status == SchedulerStatus.Running,
      retry:
        status?.Status != SchedulerStatus.Running && status?.RequestId != "",
    }),
    [status]
  );
  return (
    <Stack direction="row" spacing={2}>
      <ActionButton
        label={label}
        icon={
          <span className="icon">
            <i className="fa-solid fa-play"></i>
          </span>
        }
        disabled={!buttonState["start"]}
        onClick={() =>
          onSubmit("Do you really want to start the workflow?", {
            group: group,
            name: name,
            action: "start",
          })
        }
      >
        {label ? "Start" : ""}
      </ActionButton>
      <ActionButton
        label={label}
        icon={
          <span className="icon">
            <i className="fa-solid fa-stop"></i>
          </span>
        }
        disabled={!buttonState["stop"]}
        onClick={() =>
          onSubmit("Do you really want to cancel the workflow?", {
            group: group,
            name: name,
            action: "stop",
          })
        }
      >
        {label ? "Stop" : ""}
      </ActionButton>
      <ActionButton
        label={label}
        icon={
          <span className="icon">
            <i className="fa-solid fa-reply"></i>
          </span>
        }
        disabled={!buttonState["retry"]}
        onClick={() =>
          onSubmit(
            `Do you really want to rerun the last execution (${status?.RequestId}) ?`,
            {
              group: group,
              name: name,
              requestId: status?.RequestId,
              action: "retry",
            }
          )
        }
      >
        {label ? "Retry" : ""}
      </ActionButton>
    </Stack>
  );
}
export default WorkflowActions;

interface ActionButtonProps {
  children: string;
  label: boolean;
  icon: ReactElement;
  disabled: boolean;
  onClick: () => void;
}

function ActionButton({
  label,
  children,
  icon,
  disabled,
  onClick,
}: ActionButtonProps) {
  return label ? (
    <Button
      variant="contained"
      color="info"
      size="small"
      startIcon={icon}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  ) : (
    <IconButton color="info" size="small" onClick={onClick} disabled={disabled}>
      {icon}
    </IconButton>
  );
}
