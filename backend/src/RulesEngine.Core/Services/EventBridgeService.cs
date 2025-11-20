using Amazon.EventBridge;
using Amazon.EventBridge.Model;
using System.Text.Json;

public interface IEventBridgeService
{
    Task<bool> PublishEventAsync(IDomainEvent domainEvent, string? eventBusName = null);
}

public class EventBridgeService : IEventBridgeService
{
    private readonly IAmazonEventBridge _eventBridge;
    private readonly ILogger<EventBridgeService> _logger;

    public EventBridgeService(IAmazonEventBridge eventBridge, ILogger<EventBridgeService> logger)
    {
        _eventBridge = eventBridge;
        _logger = logger;
    }

    public async Task<bool> PublishEventAsync(IDomainEvent domainEvent, string? eventBusName = null)
    {
        try
        {
            var eventEntry = new PutEventsRequestEntry
            {
                Source = domainEvent.Source,
                DetailType = domainEvent.EventType,
                Detail = JsonSerializer.Serialize(domainEvent, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }),
                EventBusName = eventBusName ?? "rules-engine-events",
                Time = domainEvent.OccurredOn
            };

            var request = new PutEventsRequest
            {
                Entries = new List<PutEventsRequestEntry> { eventEntry }
            };

            var response = await _eventBridge.PutEventsAsync(request);

            if (response.FailedEntryCount > 0)
            {
                _logger.LogError("Failed to publish event {EventId} of type {EventType}",
                    domainEvent.EventId, domainEvent.EventType);
                return false;
            }

            _logger.LogInformation("Successfully published event {EventId} of type {EventType}",
                domainEvent.EventId, domainEvent.EventType);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing event {EventId} to EventBridge", domainEvent.EventId);
            return false;
        }
    }
}