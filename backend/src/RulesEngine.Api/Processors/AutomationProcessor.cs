using RulesEngine.Api.Models;
using RulesEngine.Api.Repositories;

namespace RulesEngine.Api.Processors;

public interface IAutomationProcessor
{
    Task<ApiResponse<AutomationRequest>> CreateAutomationAsync(AutomationRequest request);
}

public class AutomationProcessor : IAutomationProcessor
{
    private readonly ILogger<AutomationProcessor> _logger;
    private readonly IAutomationRepository _repository;

    public AutomationProcessor(ILogger<AutomationProcessor> logger,IAutomationRepository repository)
    {
        _logger = logger;
        _repository = repository;
    }

    public async Task<ApiResponse<AutomationRequest>> CreateAutomationAsync(AutomationRequest request)
    {
        try
        {
            _logger.LogInformation("Processing automation request {Id}", request.Id);
            
            // Simulate async processing
            await Task.Delay(100); // Simulating some async work
            var requestModel = new AutomationRequestModel
            {
                Version = 1,
                CreatedAt = DateTime.UtcNow,
                Data = request.Data,
            };
            // TODO: Add your automation logic here
             await _repository.SaveAutomationAsync(requestModel);
            
            return ApiResponse<AutomationRequest>.Ok(request, "Automation created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing automation request {Id}", request.Id);
            return ApiResponse<AutomationRequest>.Error(ex.Message);
        }
    }
}