package scheduler

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/yohamta/dagu/internal/config"
)

func TestCycleDetection(t *testing.T) {
	step1 := &config.Step{}
	step1.Name = "1"
	step1.Depends = []string{"2"}

	step2 := &config.Step{}
	step2.Name = "2"
	step2.Depends = []string{"1"}

	_, err := NewExecutionGraph(step1, step2)

	if err == nil {
		t.Fatal("cycle detection should be detected.")
	}
}

func TestRetryExecution(t *testing.T) {
	nodes := []*Node{
		{
			Step: &config.Step{Name: "1", Command: "true"},
			NodeState: NodeState{
				Status: NodeStatus_Success,
			},
		},
		{
			Step: &config.Step{Name: "2", Command: "true", Depends: []string{"1"}},
			NodeState: NodeState{
				Status: NodeStatus_Error,
			},
		},
		{
			Step: &config.Step{Name: "3", Command: "true", Depends: []string{"2"}},
			NodeState: NodeState{
				Status: NodeStatus_Cancel,
			},
		},
		{
			Step: &config.Step{Name: "4", Command: "true", Depends: []string{}},
			NodeState: NodeState{
				Status: NodeStatus_Skipped,
			},
		},
		{
			Step: &config.Step{Name: "5", Command: "true", Depends: []string{"4"}},
			NodeState: NodeState{
				Status: NodeStatus_Error,
			},
		},
		{
			Step: &config.Step{Name: "6", Command: "true", Depends: []string{"5"}},
			NodeState: NodeState{
				Status: NodeStatus_Success,
			},
		},
		{
			Step: &config.Step{Name: "7", Command: "true", Depends: []string{"6"}},
			NodeState: NodeState{
				Status: NodeStatus_Skipped,
			},
		},
		{
			Step: &config.Step{Name: "8", Command: "true", Depends: []string{}},
			NodeState: NodeState{
				Status: NodeStatus_Skipped,
			},
		},
	}
	_, err := RetryExecutionGraph(nodes...)
	require.NoError(t, err)
	assert.Equal(t, NodeStatus_Success, nodes[0].Status)
	assert.Equal(t, NodeStatus_None, nodes[1].Status)
	assert.Equal(t, NodeStatus_None, nodes[2].Status)
	assert.Equal(t, NodeStatus_Skipped, nodes[3].Status)
	assert.Equal(t, NodeStatus_None, nodes[4].Status)
	assert.Equal(t, NodeStatus_None, nodes[5].Status)
	assert.Equal(t, NodeStatus_None, nodes[6].Status)
	assert.Equal(t, NodeStatus_Skipped, nodes[7].Status)
}
