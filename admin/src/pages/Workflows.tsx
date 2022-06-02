import React from "react";
import { GetListResponse } from "../api/List";
import WorkflowErrors from "../components/WorkflowErrors";
import Box from "@mui/material/Box";
import CreateWorkflowButton from "../components/CreateWorkflowButton";
import WithLoading from "../components/WithLoading";
import WorkflowTable from "../components/WorkflowTable";
import Title from "../components/Title";
import Paper from "@mui/material/Paper";
import { useGetApi } from "../hooks/useWorkflowsGetApi";
import { WorkflowData, WorkflowDataType } from "../models/Workflow";
import { useLocation } from "react-router-dom";

function Workflows() {
  const useQuery = () => new URLSearchParams(useLocation().search);
  let query = useQuery();
  const group = query.get("group") || "";

  const { data, doGet } = useGetApi<GetListResponse>("/", {
    group: group,
  });

  React.useEffect(() => {
    doGet();
    const timer = setInterval(doGet, 10000);
    return () => clearInterval(timer);
  }, [group]);

  const merged = React.useMemo(() => {
    const ret: WorkflowData[] = [];
    if (data) {
      // TODO: need refactoring
      if (group != "") {
        ret.push({
          Type: WorkflowDataType.Group,
          Name: "../",
          Group: {
            Name: "",
            Dir: "",
          },
        });
      }
      for (const val of data.Groups) {
        ret.push({
          Type: WorkflowDataType.Group,
          Name: val.Name,
          Group: val,
        });
      }
      for (const val of data.DAGs) {
        if (!val.Error) {
          ret.push({
            Type: WorkflowDataType.Workflow,
            Name: val.Config.Name,
            DAG: val,
          });
        }
      }
    }
    return ret;
  }, [data, query.get("group")]);

  return (
    <Paper
      sx={{
        p: 2,
        mx: 4,
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Title>Workflows</Title>
        <CreateWorkflowButton refresh={doGet}></CreateWorkflowButton>
      </Box>
      <Box>
        <WithLoading loaded={!!data && !!merged}>
          {data && (
            <React.Fragment>
              <WorkflowErrors
                workflows={data.DAGs}
                errors={data.Errors}
                hasError={data.HasError}
              ></WorkflowErrors>
              <WorkflowTable
                workflows={merged}
                group={data.Group}
                refreshFn={doGet}
              ></WorkflowTable>
            </React.Fragment>
          )}
        </WithLoading>
      </Box>
    </Paper>
  );
}
export default Workflows;
