import React from 'react';
import { Paper, Typography, TextField, Box, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DecisionTableRule } from '../../../types/Rule';
import { AVAILABLE_INPUT_FIELDS } from '../constants';
import { ZenExpressionBuilder } from './ZenExpressionBuilder';

interface DecisionTableFormProps {
  rule: DecisionTableRule;
  onChange: (rule: DecisionTableRule) => void;
}

export const DecisionTableForm: React.FC<DecisionTableFormProps> = ({ rule, onChange }) => {
  const tableNode = rule.nodes.find(node => node.type === 'decisionTableNode');

  const addInput = () => {
    if (tableNode?.content) {
      const newInputs = [...tableNode.content.inputs, {
        id: `input${tableNode.content.inputs.length + 1}`,
        field: '',
        name: '',
        type: 'string'
      }];
      updateTable({ ...tableNode.content, inputs: newInputs });
    }
  };

  const updateTable = (content: any) => {
    const newNodes = rule.nodes.map(node =>
      node.type === 'decisionTableNode' ? { ...node, content } : node
    );
    onChange({ ...rule, nodes: newNodes });
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        Decision Table Configuration
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            {tableNode?.content?.inputs.map((input, index) => (
              <FormControl key={input.id} fullWidth sx={{ mb: 2 }}>
                <InputLabel>Input Field {index + 1}</InputLabel>
                <Select
                  value={input.field}
                  label={`Input Field ${index + 1}`}
                  onChange={(e) => {
                    const field = AVAILABLE_INPUT_FIELDS.find(f => f.field === e.target.value);
                    if (field && tableNode.content) {
                      const newInputs = [...tableNode.content.inputs];
                      newInputs[index] = { ...input, ...field };
                      updateTable({ ...tableNode.content, inputs: newInputs });
                    }
                  }}
                >
                  {AVAILABLE_INPUT_FIELDS.map((field) => (
                    <MenuItem key={field.field} value={field.field}>
                      {field.icon} {field.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};