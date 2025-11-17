using Microsoft.AspNetCore.Mvc;
using RulesEngine.Api.Models;
using RulesEngine.Api.Processors;

namespace RulesEngine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AutomationsController : ControllerBase
{
    private readonly IAutomationProcessor _processor;
    private readonly ILogger<AutomationsController> _logger;

    public AutomationsController(
        IAutomationProcessor processor,
        ILogger<AutomationsController> logger)
    {
        _processor = processor;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new automation
    /// </summary>
    /// <param name="request">The automation request containing arbitrary JSON data</param>
    /// <returns>The created automation details</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AutomationRequest>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AutomationRequest>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAutomation([FromBody] AutomationRequest request)
    {
        _logger.LogInformation("Received automation request");

        var response = await _processor.CreateAutomationAsync(request);

        if (!response.Success)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }
}