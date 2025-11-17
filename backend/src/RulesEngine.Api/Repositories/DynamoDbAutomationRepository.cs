using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.Model;
using RulesEngine.Api.Models;

namespace RulesEngine.Api.Repositories;

public interface IAutomationRepository
{
    Task SaveAutomationAsync(AutomationRequestModel request);
    Task<AutomationRequestModel> GetAutomationAsync(string id, int version);
    Task<List<AutomationRequestModel>> GetAllVersionsAsync(string id);
    Task<string> GetNextIdAsync(); // For incrementing ID
}

public class AutomationRepository : IAutomationRepository
{
    private readonly DynamoDBContext _context;
    private readonly ILogger<AutomationRepository> _logger;
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _tableName;
    private readonly string _counterTableName;

    public AutomationRepository(
        IAmazonDynamoDB dynamoDb, 
        IConfiguration config,
        ILogger<AutomationRepository> logger)
    {
        _dynamoDb = dynamoDb;
        _context = new DynamoDBContext(dynamoDb);
        _logger = logger;
        _tableName = config["DynamoDB:TableName"];
        _counterTableName = config["DynamoDB:CounterTableName"] ?? "AutomationCounters";
    }

    public async Task SaveAutomationAsync(AutomationRequestModel request)
    {
        await _context.SaveAsync(request);
        _logger.LogInformation("Saved automation with Id: {Id}, Version: {Version}", request.Id, request.Version);
    }

    public async Task<AutomationRequestModel> GetAutomationAsync(string id, int version)
    {
        return await _context.LoadAsync<AutomationRequestModel>(id, version);
    }

    public async Task<List<AutomationRequestModel>> GetAllVersionsAsync(string id)
    {
        var config = new DynamoDBOperationConfig
        {
            QueryFilter = new List<ScanCondition>()
        };

        var search = _context.QueryAsync<AutomationRequestModel>(id, config);
        return await search.GetRemainingAsync();
    }

    // Method to get next incremental ID
    public async Task<string> GetNextIdAsync()
    {
        var updateRequest = new UpdateItemRequest
        {
            TableName = _counterTableName,
            Key = new Dictionary<string, AttributeValue>
            {
                { "CounterName", new AttributeValue { S = "AutomationId" } }
            },
            UpdateExpression = "SET CurrentValue = if_not_exists(CurrentValue, :start) + :inc",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":start", new AttributeValue { N = "0" } },
                { ":inc", new AttributeValue { N = "1" } }
            },
            ReturnValues = ReturnValue.UPDATED_NEW
        };

        try
        {
            var response = await _dynamoDb.UpdateItemAsync(updateRequest);
            var nextId = response.Attributes["CurrentValue"].N;
            return nextId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting next ID");
            throw;
        }
    }
}