namespace RulesEngine.Api.Models;

public class AssignmentRequest
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public Dictionary<string, object> Data { get; set; } = new();
}