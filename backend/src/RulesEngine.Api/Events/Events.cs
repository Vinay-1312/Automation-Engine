using MediatR;
using System.Text.Json.Serialization;

// Base event interface
public interface IDomainEvent : INotification
{
    string EventId { get; }
    DateTime OccurredOn { get; }
    string EventType { get; }
    string Source { get; }
}

// Base implementation
public record DomainEventBase : IDomainEvent
{
    public string EventId { get; } = Guid.NewGuid().ToString();
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
    public virtual string EventType { get; }
    public virtual string Source { get; }
}

// Specific events
public record AssingmentCreation : DomainEventBase
{
    public override string EventType => "AssignmentCreated";
    public override string Source => "rules-engine";

    public AssignmentEvent Detail { get; set; } = new();
}




public record EventDetail
{
    public int Version { get; set; } = 1;
    public string RuleId { get; set; } = string.Empty;

    [JsonPropertyName("detail-type")]
    public string DetailType { get; set; } = string.Empty;

    public string Source { get; set; } = string.Empty;
    public string Account { get; set; } = string.Empty;
    public DateTime Time { get; set; }
    public string Region { get; set; } = string.Empty;

 
}

public record AssignmentEvent : EventDetail
{
    public string AssignmentId { get; set; } = string.Empty;
    public string Claim { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
public class OrderItem
{
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}