using System.Text.Json;
using Amazon.EventBridge;
using Amazon.EventBridge.Model;
using RulesEngine.Api.Models;

namespace RulesEngine.Api.Processors;

public interface IAssignmentProcessor
{
    Task<ApiResponse<AssignmentRequest>> CreateAssignmentAsync(AssignmentRequest request);
}

public class AssignmentProcessor : IAssignmentProcessor
{
    private readonly ILogger<AssignmentProcessor> _logger;
    private readonly IAmazonEventBridge _eventBridge;

    public AssignmentProcessor(ILogger<AssignmentProcessor> logger, IAmazonEventBridge eventBridge)
    {
        _logger = logger;
        _eventBridge = eventBridge;
    }

    public async Task<ApiResponse<AssignmentRequest>> CreateAssignmentAsync(AssignmentRequest request)
    {
        try
        {
            _logger.LogInformation("Processing assignment request {Id}", request.Id);
            
            // Simulate async processing
            await Task.Delay(100); // Simulating some async work
            var businessData = new
            {
                version = 1,
                ruleId = "282e10be-7891-46d1-b046-66b8e7196645",
                assignmentId = "asg-001",
                claim = "cal123",
                createdAt = "2024-01-15T10:30:00Z"
            };
            
            var Event = new PutEventsRequest
            {
                Entries = new List<PutEventsRequestEntry>  // ✅ Required "Entries" property
                {
                    new PutEventsRequestEntry
                    {
                        // ✅ EventBridge metadata (top-level)
                        Source = "rules-engine",                    // ✅ Matches: ["rules-engine"]
                        DetailType = "rule-evaluation-request",   // ✅ Correct location
                        Detail = JsonSerializer.Serialize(businessData), // ✅ Business data as JSON string
                        Time = DateTime.UtcNow,                 // ✅ Optional - AWS can set this
                        EventBusName = "rules-engine-events", 
                        // AWS automatically adds:
                        // - account
                        // - region  
                        // - eventId
                    
                        // Optional properties:
                        //      // ✅ Optional - defaults to "default"
                        // Resources = new List<string> { "resource-arn" } // ✅ Optional
                    }
                }
            };
            var response = await _eventBridge.PutEventsAsync(Event).ConfigureAwait(false);
            // TODO: Add your assignment logic here
            // For example: await _repository.SaveAssignmentAsync(request);
            
            return ApiResponse<AssignmentRequest>.Ok(request, "Assignment created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing assignment request {Id}", request.Id);
            return ApiResponse<AssignmentRequest>.Error(ex.Message);
        }
    }
}