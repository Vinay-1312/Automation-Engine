

using Amazon.DynamoDBv2.DataModel;

namespace RulesEngine.Api.Models;

[DynamoDBTable("RulesTable")] // Replace with your actual table name
public class AutomationRequestModel
{
    [DynamoDBHashKey("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [DynamoDBRangeKey("version")]
    public int Version { get; set; } = 1;

    // Store as JSON string to avoid JsonElement serialization issues
    [DynamoDBProperty("data")]
    public string DataJson { get; set; } = "{}";

    [DynamoDBProperty("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Helper property to work with Data as Dictionary (not stored in DB)
    [DynamoDBIgnore]
    public Dictionary<string, object> Data
    {
        get => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(DataJson)
               ?? new Dictionary<string, object>();
        set => DataJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
}