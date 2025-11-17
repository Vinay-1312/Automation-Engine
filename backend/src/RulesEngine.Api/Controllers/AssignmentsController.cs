using Microsoft.AspNetCore.Mvc;
using RulesEngine.Api.Models;
using RulesEngine.Api.Processors;

namespace RulesEngine.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentProcessor _processor;
    private readonly ILogger<AssignmentsController> _logger;

    public AssignmentsController(
        IAssignmentProcessor processor,
        ILogger<AssignmentsController> logger)
    {
        _processor = processor;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new assignment
    /// </summary>
    /// <param name="request">The assignment request containing arbitrary JSON data</param>
    /// <returns>The created assignment details</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AssignmentRequest>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AssignmentRequest>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAssignment([FromBody] AssignmentRequest request)
    {
        _logger.LogInformation("Received assignment request");

        var response = await _processor.CreateAssignmentAsync(request);

        if (!response.Success)
        {
            return BadRequest(response);
        }

        return Ok(response);
    }
}