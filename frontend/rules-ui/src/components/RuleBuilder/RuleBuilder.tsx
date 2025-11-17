import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Card, CardContent } from '@mui/material';
import { Grid } from '@mui/material';
import { Rule } from '../../types/Rule';
import axios from 'axios';

const initialRule: Rule = {
  name: '',
  when: {
    eventType: '',
    source: ''
  },
  if: {
    conditions: []
  },
  then: {
    actions: []
  }
};

export const RuleBuilder: React.FC = () => {
  const [rule, setRule] = useState<Rule>(initialRule);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8080/api/Automations', rule, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = response.data;
      console.log('Rule created successfully:', data);
      
      // Reset form
      setRule(initialRule);
      alert('Rule created successfully!');
    } catch (error) {
      console.error('Error creating rule:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data || error.message);
      } else {
        setError('An error occurred while creating the rule');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create Rule
      </Typography>
      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Rule Name"
            value={rule.name}
            onChange={(e) => setRule({ ...rule, name: e.target.value })}
            margin="normal"
          />
        </Paper>

        <Grid container spacing={2}>
          {/* When Block */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  When
                </Typography>
                <TextField
                  fullWidth
                  label="Event Type"
                  value={rule.when.eventType}
                  onChange={(e) =>
                    setRule({
                      ...rule,
                      when: { ...rule.when, eventType: e.target.value }
                    })
                  }
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Source"
                  value={rule.when.source}
                  onChange={(e) =>
                    setRule({
                      ...rule,
                      when: { ...rule.when, source: e.target.value }
                    })
                  }
                  margin="normal"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* If Block */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  If
                </Typography>
                {/* Add condition builder here */}
                <Button
                  variant="outlined"
                  onClick={() =>
                    setRule({
                      ...rule,
                      if: {
                        conditions: [
                          ...rule.if.conditions,
                          { field: '', operator: '', value: '' }
                        ]
                      }
                    })
                  }
                >
                  Add Condition
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Then Block */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Then
                </Typography>
                {/* Add action builder here */}
                <Button
                  variant="outlined"
                  onClick={() =>
                    setRule({
                      ...rule,
                      then: {
                        actions: [
                          ...rule.then.actions,
                          { type: '', parameters: {} }
                        ]
                      }
                    })
                  }
                >
                  Add Action
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Rule'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};