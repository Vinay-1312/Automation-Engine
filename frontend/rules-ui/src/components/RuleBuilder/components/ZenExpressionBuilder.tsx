import React, { useState } from 'react';
import {
  Box,
  Grid,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
  List,
  ListItem,
} from '@mui/material';
import { 
  Help as HelpIcon,
  Code as CodeIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { AVAILABLE_TOOLS } from '../constants';
import { SelectChangeEvent } from '@mui/material/Select';

// Operator definitions for zen expressions
const ZEN_OPERATORS = [
  {
    value: 'equals',
    label: 'Equals',
    symbol: '==',
    expression: '$ == {}',
    example: '$ == 100',
    category: 'comparison',
    icon: '=',
    description: 'Checks if the value is exactly equal to the specified value'
  },
  {
    value: 'not_equals',
    label: 'Not Equals',
    symbol: '!=',
    expression: '$ != {}',
    example: '$ != 0',
    category: 'comparison',
    icon: '≠',
    description: 'Checks if the value is not equal to the specified value'
  },
  {
    value: 'greater_than',
    label: 'Greater Than',
    symbol: '>',
    expression: '$ > {}',
    example: '$ > 100',
    category: 'comparison',
    icon: '>',
    description: 'Checks if the value is greater than the specified value'
  },
  {
    value: 'less_than',
    label: 'Less Than',
    symbol: '<',
    expression: '$ < {}',
    example: '$ < 100',
    category: 'comparison',
    icon: '<',
    description: 'Checks if the value is less than the specified value'
  },
  {
    value: 'greater_equals',
    label: 'Greater Than or Equal',
    symbol: '>=',
    expression: '$ >= {}',
    example: '$ >= 100',
    category: 'comparison',
    icon: '≥',
    description: 'Checks if the value is greater than or equal to the specified value'
  },
  {
    value: 'less_equals',
    label: 'Less Than or Equal',
    symbol: '<=',
    expression: '$ <= {}',
    example: '$ <= 100',
    category: 'comparison',
    icon: '≤',
    description: 'Checks if the value is less than or equal to the specified value'
  },
  {
    value: 'contains',
    label: 'Contains',
    symbol: 'contains',
    expression: '$ contains {}',
    example: '$ contains "test"',
    category: 'text',
    icon: '∋',
    description: 'Checks if the string contains the specified text'
  },
  {
    value: 'not_contains',
    label: 'Does Not Contain',
    symbol: 'not contains',
    expression: '$ not contains {}',
    example: '$ not contains "test"',
    category: 'text',
    icon: '∌',
    description: 'Checks if the string does not contain the specified text'
  },
  {
    value: 'starts_with',
    label: 'Starts With',
    symbol: 'startswith',
    expression: '$ startswith {}',
    example: '$ startswith "prefix"',
    category: 'text',
    icon: '⟰',
    description: 'Checks if the string starts with the specified text'
  },
  {
    value: 'ends_with',
    label: 'Ends With',
    symbol: 'endswith',
    expression: '$ endswith {}',
    example: '$ endswith "suffix"',
    category: 'text',
    icon: '⟱',
    description: 'Checks if the string ends with the specified text'
  },
  {
    value: 'is_empty',
    label: 'Is Empty',
    symbol: 'is empty',
    expression: '$ is empty',
    example: '$ is empty',
    category: 'special',
    icon: '∅',
    description: 'Checks if the value is empty (null, undefined, empty string)'
  },
  {
    value: 'is_not_empty',
    label: 'Is Not Empty',
    symbol: 'is not empty',
    expression: '$ is not empty',
    example: '$ is not empty',
    category: 'special',
    icon: '∉',
    description: 'Checks if the value is not empty'
  }
];

// Enhanced Zen Expression Builder Component
interface ZenExpressionBuilderProps {
  value: string;
  onChange: (value: string) => void;
  fieldType?: 'string' | 'number' | 'boolean' | 'expression';
  mode?: 'input' | 'output';
  fieldId?: string; // To identify special fields like 'tool'
  ruleIndex?: number; // To identify which rule this belongs to
  onParameterChange?: (ruleIndex: number, paramKey: string, paramValue: string) => void;
  ruleParameters?: Record<string, string | number>;
  selectedTool?: string; // The selected tool value from the rule
}

const ZenExpressionBuilder: React.FC<ZenExpressionBuilderProps> = ({
  value,
  onChange,
  fieldType = 'expression',
  mode = 'input',
  fieldId,
  ruleIndex,
  onParameterChange,
  ruleParameters = {},
  selectedTool = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState('equals');
  const [compareValue, setCompareValue] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  React.useEffect(() => {
    // Auto-detect if advanced mode should be shown
    if (value && (value.includes(' and ') || value.includes(' or ') || value.includes('('))) {
      setShowAdvanced(true);
    } else if (value) {
      // Try to parse simple expression
      const operator = ZEN_OPERATORS.find(op => value.includes(op.symbol));
      if (operator) {
        setSelectedOperator(operator.value);
        // Extract value
        const valuePart = value.split(operator.symbol)[1]?.trim().replace(/['"]/g, '');
        setCompareValue(valuePart || '');
      }
    }
  }, [value]);

  const buildExpression = (operator: string, val: string) => {
    const op = ZEN_OPERATORS.find(o => o.value === operator);
    if (!op) return val;

    if (operator === 'is_empty' || operator === 'is_not_empty') {
      return op.expression;
    }

    let formattedValue = val;
    // Add quotes for string values in text operations
    if (['contains', 'not_contains', 'starts_with', 'ends_with'].includes(operator)) {
      formattedValue = val;
    } else if (fieldType === 'string' && !val.startsWith('"')) {
      formattedValue = `"${val}"`;
    }

    return op.expression.replace('{}', formattedValue);
  };

  const handleOperatorChange = (newOperator: string) => {
    setSelectedOperator(newOperator);
    const expr = buildExpression(newOperator, compareValue);
    onChange(expr);
  };

  const handleValueChange = (newValue: string) => {
    setCompareValue(newValue);
    const expr = buildExpression(selectedOperator, newValue);
    onChange(expr);
  };

  if (mode === 'output') {
    // Special handling for 'output1' (action) field - always show tool_call (read-only)
    if (fieldId === 'output1') {
      return (
        <Box>
          <TextField
            fullWidth
            value="tool_call"
            size="small"
            disabled
            helperText="Action is always tool_call for decision tables"
            sx={{
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                color: 'rgba(0, 0, 0, 0.87)'
              }
            }}
          />
        </Box>
      );
    }

    // Special handling for 'tool' field - show dropdown for tool selection
    if (fieldId === 'tool') {
      const selectedTool = value.replace(/^["']|["']$/g, '');

      return (
        <Box>
          <FormControl fullWidth size="small">
            <Select
              value={selectedTool}
              onChange={(e: SelectChangeEvent) => {
                const val = e.target.value;
                onChange(`"${val}"`);
              }}
              displayEmpty
            >
              <MenuItem value="" disabled>
                <em>Select a tool...</em>
              </MenuItem>
              {AVAILABLE_TOOLS.map((tool) => (
                <MenuItem key={tool.value} value={tool.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{tool.icon}</span>
                    {tool.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      );
    }

    // Simplified output mode for other fields
    return (
      <Box>
        <TextField
          fullWidth
          value={value.replace(/^["']|["']$/g, '')}
          onChange={(e) => {
            const val = e.target.value;
            onChange(fieldType === 'string' && val ? `"${val}"` : val);
          }}
          placeholder="Enter result value"
          size="small"
          type={fieldType === 'number' ? 'number' : 'text'}
        />
      </Box>
    );
  }

  if (showAdvanced) {
    return (
      <Box>
        <TextField
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter zen expression (e.g., $ > 100 and $ < 500)"
          size="small"
          multiline
          maxRows={3}
          sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
          InputProps={{
            endAdornment: (
              <Tooltip title="Example zen expressions">
                <IconButton size="small" onClick={() => setShowHelp(true)}>
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          }}
        />
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Button
            size="small"
            onClick={() => setShowAdvanced(false)}
            variant="text"
          >
            Simple Mode
          </Button>
          <Chip
            label={`Zen Expression Mode`}
            size="small"
            icon={<CodeIcon />}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>
    );
  }

  const currentOp = ZEN_OPERATORS.find(op => op.value === selectedOperator);

  return (
    <Box>
      <Grid container spacing={1}>
        <Grid item xs={12} md={5}>
          <FormControl fullWidth size="small">
            <Select
              value={selectedOperator}
              onChange={(e) => handleOperatorChange(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                <em>Select operator...</em>
              </MenuItem>
              {Object.entries(
                ZEN_OPERATORS.reduce((acc, op) => {
                  if (!acc[op.category]) acc[op.category] = [];
                  acc[op.category].push(op);
                  return acc;
                }, {} as Record<string, typeof ZEN_OPERATORS>)
              ).map(([category, ops]) => [
                <ListItem key={`cat-${category}`} sx={{ bgcolor: 'grey.100', py: 0.5 }}>
                  <Typography variant="caption" fontWeight="bold" color="primary">
                    {category.toUpperCase()}
                  </Typography>
                </ListItem>,
                ...ops.map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                        {op.icon}
                      </Typography>
                      <Box>
                        <Typography variant="body2">{op.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {op.symbol}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))
              ])}
            </Select>
          </FormControl>
        </Grid>
        {selectedOperator !== 'is_empty' && selectedOperator !== 'is_not_empty' && (
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              value={compareValue}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Enter value to compare"
              size="small"
              type={fieldType === 'number' ? 'number' : 'text'}
            />
          </Grid>
        )}
      </Grid>

      {currentOp && (
        <Box sx={{ mt: 1 }}>
          <Paper elevation={0} sx={{ p: 1, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LightbulbIcon sx={{ fontSize: 14 }} />
              <strong>Generated:</strong>
              <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                {value || currentOp.example}
              </code>
            </Typography>
          </Paper>
        </Box>
      )}

      <Box sx={{ mt: 1 }}>
        <Button
          size="small"
          onClick={() => setShowAdvanced(true)}
          variant="text"
          startIcon={<CodeIcon />}
        >
          Advanced Mode
        </Button>
        <Tooltip title={currentOp?.description || ''}>
          <IconButton size="small" onClick={() => setShowHelp(true)}>
            <HelpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Help Dialog */}
      <Dialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="md" fullWidth>
        <DialogTitle>Zen Expression Guide</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Zen expressions use <code>$</code> as a placeholder for the field value.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Available Operators
          </Typography>
          <List dense>
            {ZEN_OPERATORS.map((op) => (
              <ListItem key={op.value} sx={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '1.2rem', minWidth: 30 }}>
                    {op.icon}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {op.label} <Chip label={op.symbol} size="small" sx={{ ml: 1 }} />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {op.description}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ ml: 5, mt: 0.5 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 0.5, borderRadius: 1 }}>
                    {op.example}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>Combine conditions:</strong> Use <code>and</code> or <code>or</code> to combine multiple conditions.
            <br />
            Example: <code>$ &gt; 100 and $ &lt; 500</code>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelp(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ZenExpressionBuilder;