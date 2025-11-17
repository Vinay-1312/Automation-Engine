import axios from 'axios';
import React, { useState } from 'react';

const AVAILABLE_EVENTS = [
  { id: 1, name: 'New Assignment Received', icon: '📋' }
];

const AVAILABLE_INPUT_FIELDS = [
  { field: 'claim', name: 'Claim ID', type: 'string', icon: '🆔' },
  { field: 'amount', name: 'Amount', type: 'number', icon: '💰' },
  { field: 'status', name: 'Status', type: 'string', icon: '📊' },
];

const OPERATORS = {
  string: [
    { value: 'equals', label: 'is equal to', zen: '$ == "{value}"' },
    { value: 'not_equals', label: 'is not equal to', zen: '$ != "{value}"' },
    { value: 'contains', label: 'contains', zen: 'contains($, "{value}")' },
    { value: 'not_contains', label: 'does not contain', zen: '!contains($, "{value}")' },
    { value: 'starts_with', label: 'starts with', zen: 'startsWith($, "{value}")' },
    { value: 'ends_with', label: 'ends with', zen: 'endsWith($, "{value}")' },
    { value: 'is_empty', label: 'is empty', zen: '$ == null', noValue: true },
    { value: 'is_not_empty', label: 'is not empty', zen: '$ != null', noValue: true },
  ],
  number: [
    { value: 'equals', label: 'is equal to', zen: '$ == {value}' },
    { value: 'not_equals', label: 'is not equal to', zen: '$ != {value}' },
    { value: 'greater_than', label: 'is greater than', zen: '$ > {value}' },
    { value: 'less_than', label: 'is less than', zen: '$ < {value}' },
    { value: 'greater_equal', label: 'is greater than or equal to', zen: '$ >= {value}' },
    { value: 'less_equal', label: 'is less than or equal to', zen: '$ <= {value}' },
    { value: 'is_empty', label: 'is empty', zen: '$ == null', noValue: true },
    { value: 'is_not_empty', label: 'is not empty', zen: '$ != null', noValue: true },
  ]
};

const AVAILABLE_TOOLS = [
  { value: 'create_task', label: 'Create Task', icon: '📋', fields: ['task_name'] },
  { value: 'send_email', label: 'Send Email', icon: '📧', fields: ['email_to', 'email_subject', 'email_body'] },
  { value: 'update_field', label: 'Update Field', icon: '✏️', fields: ['field_name', 'field_value'] },
];

const ACTION_FIELD_LABELS = {
  task_name: { label: 'Task Name', placeholder: 'Enter task name', type: 'text' },
  email_to: { label: 'To Email', placeholder: 'recipient@example.com', type: 'email' },
  email_subject: { label: 'Email Subject', placeholder: 'Enter email subject', type: 'text' },
  email_body: { label: 'Email Body', placeholder: 'Enter email message', type: 'textarea' },
  field_name: { label: 'Field Name', placeholder: 'Enter field name', type: 'text' },
  field_value: { label: 'Field Value', placeholder: 'Enter field value', type: 'text' },
};

export  function EnhancedRuleBuilder() {
  const [ruleName, setRuleName] = useState('');
  const [eventId, setEventId] = useState('');
  const [inputs, setInputs] = useState([]);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [jsonPreview, setJsonPreview] = useState('');

  const addInput = () => {
    setInputs([...inputs, { id: `input${inputs.length + 1}`, field: '', name: '', type: 'string' }]);
  };

  const removeInput = (index) => {
    setInputs(inputs.filter((_, i) => i !== index));
    setRules(rules.map(rule => {
      const { [inputs[index].id]: removed, ...rest } = rule;
      return rest;
    }));
  };

  const updateInput = (index, selectedField) => {
    const newInputs = [...inputs];
    newInputs[index] = {
      ...newInputs[index],
      field: selectedField.field,
      name: selectedField.name,
      type: selectedField.type
    };
    setInputs(newInputs);
  };

  const addRule = () => {
    const newRule = { id: `rule${rules.length + 1}`, conditions: [], action_type: '' };
    inputs.forEach(input => {
      newRule[input.id] = '';
    });
    setRules([...rules, newRule]);
  };

  const addCondition = (ruleIndex) => {
    const newRules = [...rules];
    if (!newRules[ruleIndex].conditions) {
      newRules[ruleIndex].conditions = [];
    }
    newRules[ruleIndex].conditions.push({
      field: '',
      operator: '',
      value: ''
    });
    setRules(newRules);
  };

  const updateCondition = (ruleIndex, condIndex, field, value) => {
    const newRules = [...rules];
    newRules[ruleIndex].conditions[condIndex][field] = value;
    setRules(newRules);
  };

  const removeCondition = (ruleIndex, condIndex) => {
    const newRules = [...rules];
    newRules[ruleIndex].conditions.splice(condIndex, 1);
    setRules(newRules);
  };

  const convertConditionToZen = (condition) => {
    if (!condition.field || !condition.operator) return '';
    
    const inputField = inputs.find(inp => inp.field === condition.field);
    if (!inputField) return '';
    
    const operators = OPERATORS[inputField.type] || [];
    const operator = operators.find(op => op.value === condition.operator);
    if (!operator) return '';
    
    if (operator.noValue) {
      return operator.zen;
    }
    
    return operator.zen.replace('{value}', condition.value);
  };

  const removeRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRuleField = (ruleIndex, fieldName, value) => {
    const newRules = [...rules];
    newRules[ruleIndex] = { ...newRules[ruleIndex], [fieldName]: value };
    setRules(newRules);
  };

  const generateJSON = () => {
    const json = {
  name: ruleName,
  kind: 'Decision',
  when: {
    eventId: eventId,
    eventName: AVAILABLE_EVENTS.find(e => e.id === Number(eventId))?.name || ''
  },
  nodes: [
    {
      id: 'request',
      name: 'Request',
      type: 'inputNode',
      position: { x: 100, y: 200 }
    },
    {
      id: 'decision_table',
      name: 'Decision Table',
      type: 'decisionTableNode',
      position: { x: 300, y: 200 },
      content: {
        hitPolicy: 'first',
        inputs: inputs.map(inp => ({
          id: inp.id,
          field: inp.field,
          name: inp.name,
          type: 'expression'
        })),
        outputs: [
          { id: 'action', field: 'action', name: 'Action', type: 'expression' },
          ...Object.keys(ACTION_FIELD_LABELS).map(fieldKey => ({
            id: fieldKey,
            field: fieldKey,
            name: ACTION_FIELD_LABELS[fieldKey].label,
            type: 'expression'
          }))
        ],
        rules: rules.map(rule => {
          const convertedRule = { id: rule.id };
          
          // Convert conditions to zen expressions for each input
          inputs.forEach(input => {
            const relevantConditions = (rule.conditions || []).filter(c => c.field === input.field);
            if (relevantConditions.length > 0) {
              // Combine multiple conditions with AND logic
              const zenExpressions = relevantConditions.map(c => convertConditionToZen(c)).filter(z => z);
              convertedRule[input.id] = zenExpressions.length > 0 ? zenExpressions.join(' && ') : '';
            } else {
              convertedRule[input.id] = '';
            }
          });
          
          // Add action - wrap in quotes for ZEN Engine
          convertedRule.action = rule.action_type ? `"${rule.action_type}"` : '""';
          
          // Add all action fields - wrap non-empty strings in quotes
          Object.keys(ACTION_FIELD_LABELS).forEach(fieldKey => {
            const value = rule[fieldKey] || '';
            // Wrap string literals in quotes for ZEN Engine
            // Escape any internal quotes
            const escapedValue = value.replace(/"/g, '\\"');
            convertedRule[fieldKey] = `"${escapedValue}"`;
          });
          
          return convertedRule;
        })
      }
    },
    {
      id: 'response',
      name: 'Response',
      type: 'outputNode',
      position: { x: 500, y: 200 }
    }
  ],
  edges: [
    { id: 'edge1', sourceId: 'request', targetId: 'decision_table' },
    { id: 'edge2', sourceId: 'decision_table', targetId: 'response' }
  ]
};

setJsonPreview(JSON.stringify(json, null, 2));
return json;
  };

  const handleSubmit = async() => {
    setError(null);
    setSuccess(null);

    if (!ruleName.trim()) {
      setError('Rule name is required');
      return;
    }
    if (!eventId) {
      setError('Please select an event');
      return;
    }
    if (inputs.length === 0) {
      setError('Add at least one input field');
      return;
    }
    if (rules.length === 0) {
      setError('Add at least one rule');
      return;
    }

    const json = generateJSON();
    const request = {
      id : "1",
      data : json,
    }
    try {
      const response = await axios.post('http://localhost:8080/api/Automations', request, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = response.data;
      console.log('Rule created successfully:', data);
      
      // Reset form
     
      alert('Rule created successfully!');
    } catch (error) {
      console.error('Error creating rule:', error);
     
    } 
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 'bold' }}>🚀 Simple Rule Builder</h1>
        <p style={{ margin: 0, fontSize: '16px' }}>Build automation rules by updating JSON fields</p>
      </div>

      {success && (
        <div style={{ padding: '16px', marginBottom: '24px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', color: '#155724' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px', marginBottom: '24px', background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', color: '#721c24' }}>
          {error}
        </div>
      )}

      {/* Rule Name */}
      <div style={{ padding: '24px', marginBottom: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>📝 Rule Name</h3>
        <input
          type="text"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          placeholder="Enter rule name"
          style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        />
      </div>

      {/* Event Selection */}
      <div style={{ padding: '24px', marginBottom: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>⚡ Trigger Event</h3>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        >
          <option value="">Select an event...</option>
          {AVAILABLE_EVENTS.map((event) => (
            <option key={event.id} value={event.id}>
              {event.icon} {event.name}
            </option>
          ))}
        </select>
      </div>

      {/* Input Fields */}
      <div style={{ padding: '24px', marginBottom: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>📥 Input Fields</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {inputs.map((input, index) => (
            <div key={input.id} style={{ padding: '16px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <strong>Input {index + 1}</strong>
                <button
                  onClick={() => removeInput(index)}
                  style={{ background: '#dc3545', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
              <select
                value={input.field}
                onChange={(e) => {
                  const field = AVAILABLE_INPUT_FIELDS.find(f => f.field === e.target.value);
                  if (field) updateInput(index, field);
                }}
                style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Select field...</option>
                {AVAILABLE_INPUT_FIELDS.map((field) => (
                  <option key={field.field} value={field.field}>
                    {field.icon} {field.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button
          onClick={addInput}
          style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Add Input Field
        </button>
      </div>

      {/* Rules */}
      <div style={{ padding: '24px', marginBottom: '24px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>🎲 Decision Rules</h3>
        {rules.map((rule, ruleIndex) => (
          <div key={rule.id} style={{ padding: '16px', marginBottom: '16px', background: '#fff8e1', border: '2px solid #ffd54f', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <strong style={{ fontSize: '16px' }}>Rule {ruleIndex + 1}</strong>
              <button
                onClick={() => removeRule(ruleIndex)}
                style={{ background: '#dc3545', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '16px', background: '#e3f2fd', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#1976d2' }}>🔍 IF - Conditions (When should this rule apply?)</p>
                <button
                  onClick={() => addCondition(ruleIndex)}
                  style={{ background: '#1976d2', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  + Add Condition
                </button>
              </div>
              
              {(!rule.conditions || rule.conditions.length === 0) ? (
                <div style={{ padding: '12px', background: 'white', borderRadius: '4px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                  No conditions yet. Click "Add Condition" to define when this rule should trigger.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rule.conditions.map((condition, condIndex) => {
                    const selectedInput = inputs.find(inp => inp.field === condition.field);
                    const availableOperators = selectedInput ? OPERATORS[selectedInput.type] || [] : [];
                    const selectedOperator = availableOperators.find(op => op.value === condition.operator);
                    
                    return (
                      <div key={condIndex} style={{ padding: '12px', background: 'white', borderRadius: '4px', border: '1px solid #90caf9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 'bold', color: '#666', minWidth: '40px' }}>
                            {condIndex > 0 ? 'AND' : 'IF'}
                          </span>
                          
                          <select
                            value={condition.field}
                            onChange={(e) => updateCondition(ruleIndex, condIndex, 'field', e.target.value)}
                            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '150px' }}
                          >
                            <option value="">Select field...</option>
                            {inputs.map((input) => (
                              <option key={input.field} value={input.field}>
                                {input.icon} {input.name}
                              </option>
                            ))}
                          </select>

                          {condition.field && (
                            <>
                              <select
                                value={condition.operator}
                                onChange={(e) => updateCondition(ruleIndex, condIndex, 'operator', e.target.value)}
                                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '180px' }}
                              >
                                <option value="">Select condition...</option>
                                {availableOperators.map((op) => (
                                  <option key={op.value} value={op.value}>
                                    {op.label}
                                  </option>
                                ))}
                              </select>

                              {condition.operator && !selectedOperator?.noValue && (
                                <input
                                  type={selectedInput?.type === 'number' ? 'number' : 'text'}
                                  value={condition.value}
                                  onChange={(e) => updateCondition(ruleIndex, condIndex, 'value', e.target.value)}
                                  placeholder="Enter value..."
                                  style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '150px', flex: 1 }}
                                />
                              )}
                            </>
                          )}

                          <button
                            onClick={() => removeCondition(ruleIndex, condIndex)}
                            style={{ background: '#f44336', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}
                            title="Remove condition"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {condition.field && condition.operator && (
                          <div style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
                            Zen: {convertConditionToZen(condition) || 'incomplete'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: '16px', background: '#e8f5e9', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#2e7d32' }}>✨ THEN - Action (What should happen?)</p>
              
              <div style={{ marginBottom: '12px' }}>
                <select
                  value={rule.action_type || ''}
                  onChange={(e) => {
                    updateRuleField(ruleIndex, 'action_type', e.target.value);
                  }}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select action...</option>
                  {AVAILABLE_TOOLS.map((tool) => (
                    <option key={tool.value} value={tool.value}>
                      {tool.icon} {tool.label}
                    </option>
                  ))}
                </select>
              </div>

              {rule.action_type && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {AVAILABLE_TOOLS.find(t => t.value === rule.action_type)?.fields.map((fieldKey) => {
                    const fieldConfig = ACTION_FIELD_LABELS[fieldKey];
                    return (
                      <div key={fieldKey}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#555' }}>
                          {fieldConfig.label}
                        </label>
                        {fieldConfig.type === 'textarea' ? (
                          <textarea
                            value={rule[fieldKey] || ''}
                            onChange={(e) => updateRuleField(ruleIndex, fieldKey, e.target.value)}
                            placeholder={fieldConfig.placeholder}
                            rows={3}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <input
                            type={fieldConfig.type}
                            value={rule[fieldKey] || ''}
                            onChange={(e) => updateRuleField(ruleIndex, fieldKey, e.target.value)}
                            placeholder={fieldConfig.placeholder}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        <button
          onClick={addRule}
          disabled={inputs.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            background: inputs.length === 0 ? '#ccc' : '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: inputs.length === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Add Rule
        </button>
      </div>

      {/* JSON Preview */}
      {jsonPreview && (
        <div style={{ padding: '24px', marginBottom: '24px', background: '#1e1e1e', color: '#d4d4d4', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>📄 JSON Preview</h3>
          <pre style={{ fontSize: '13px', overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {jsonPreview}
          </pre>
        </div>
      )}

      {/* Submit Buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={handleSubmit}
          style={{
            padding: '14px 32px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ▶ Create Rule
        </button>
        <button
          onClick={() => generateJSON()}
          style={{
            padding: '14px 32px',
            background: 'white',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '4px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          👁 Preview JSON
        </button>
      </div>
    </div>
  );
}