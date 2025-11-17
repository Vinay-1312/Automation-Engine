import React from 'react';
import {
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';

interface TaskActionFieldsProps {
  ruleIndex: number;
  taskName: string;
  dueIn: string;
  assignee: string;
  priority: string;
  onFieldChange: (ruleIndex: number, fieldName: string, value: string) => void;
}

export const TaskActionFields: React.FC<TaskActionFieldsProps> = ({
  ruleIndex,
  taskName,
  dueIn,
  assignee,
  priority,
  onFieldChange
}) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Task Name"
            value={taskName}
            onChange={(e) => onFieldChange(ruleIndex, `task_name`, e.target.value)}
            placeholder="Enter task name"
            sx={{ bgcolor: 'white', borderRadius: 1 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Due in (days)"
            type="number"
            value={dueIn}
            onChange={(e) => onFieldChange(ruleIndex, `due_in`, e.target.value)}
            placeholder="e.g., 7"
            sx={{ bgcolor: 'white', borderRadius: 1 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Assignee"
            value={assignee}
            onChange={(e) => onFieldChange(ruleIndex, `assignee`, e.target.value)}
            placeholder="Enter assignee name"
            sx={{ bgcolor: 'white', borderRadius: 1 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              label="Priority"
              onChange={(e: SelectChangeEvent) => onFieldChange(ruleIndex, `priority`, e.target.value)}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};
