import React from 'react';
import { Paper, Typography, TextField, Box } from '@mui/material';
import { SimpleRule } from '../../../types/Rule';

interface SimpleRuleFormProps {
  rule: SimpleRule;
  onChange: (rule: SimpleRule) => void;
}

export const SimpleRuleForm: React.FC<SimpleRuleFormProps> = ({ rule, onChange }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        Simple Rule Configuration
      </Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Rule Name"
          value={rule.name}
          onChange={(e) => onChange({ ...rule, name: e.target.value })}
          required
        />
      </Box>
      {/* Add other simple rule form fields */}
    </Paper>
  );
};