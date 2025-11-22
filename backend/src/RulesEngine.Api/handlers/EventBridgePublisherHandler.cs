// EventBridgePublisherHandler.cs
using MediatR;




public class EventBridgePublisherHandler<T> : INotificationHandler<T>
    where T : IDomainEvent
{
    private readonly IEventBridgeService _eventBridge;
    private readonly ILogger<EventBridgePublisherHandler<T>> _logger;

    public EventBridgePublisherHandler(
        IEventBridgeService eventBridge,
        ILogger<EventBridgePublisherHandler<T>> logger)
    {
        _eventBridge = eventBridge;
        _logger = logger;
    }

    public async Task Handle(T notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Auto-publishing event {EventType} with ID {EventId} to EventBridge",
            notification.EventType, notification.EventId);

        var success = await _eventBridge.PublishEventAsync(notification);

        if (!success)
        {
            _logger.LogError("Failed to auto-publish event {EventType} with ID {EventId}",
                notification.EventType, notification.EventId);
        }
    }
}