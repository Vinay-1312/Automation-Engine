using System.Reflection;
using Amazon;
using Amazon.DynamoDBv2;
using Amazon.EventBridge;
using RulesEngine.Api.Processors;
using RulesEngine.Api.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    if (builder.Environment.IsProduction())
    {
        // In production (Docker), use HTTP only
        serverOptions.ListenAnyIP(8080); // Fixed port for container
    }
    else
    {
        // In development, use both HTTP and HTTPS
        serverOptions.ListenLocalhost(5000);    // HTTP
        
        // Only configure HTTPS if dev certificate is available
        try
        {
            serverOptions.ListenLocalhost(5001, listenOptions =>
            {
                listenOptions.UseHttps(); // Uses dev certificate
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"HTTPS not available: {ex.Message}");
            Console.WriteLine("Running HTTP only. To enable HTTPS, run: dotnet dev-certs https --trust");
        }
    }
});

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

builder.Services.AddControllers();

// Add Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Rules Engine API",
        Version = "v1",
        Description = "API for managing automations and assignments",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "API Support",
            Email = "support@rulesengine.com"
        }
    });

    // Include XML comments in Swagger documentation if available
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    // Add response examples
    options.UseInlineDefinitionsForEnums();
    options.EnableAnnotations();
});

// Register processors
builder.Services.AddScoped<IAutomationProcessor, AutomationProcessor>();
builder.Services.AddScoped<IAssignmentProcessor, AssignmentProcessor>();
builder.Services.AddScoped<IAutomationRepository, AutomationRepository>();
builder.Services.AddSingleton<IAmazonDynamoDB>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var region = configuration["DynamoDB:Region"];
    
    var config = new AmazonDynamoDBConfig
    {
        RegionEndpoint = RegionEndpoint.GetBySystemName(region)
    };
    
    return new AmazonDynamoDBClient(config);
});

builder.Services.AddSingleton<IAmazonEventBridge>(provider =>
{
    var config = new AmazonEventBridgeConfig
    {
        RegionEndpoint = Amazon.RegionEndpoint.EUWest2,
        MaxErrorRetry = 3,
        Timeout = TimeSpan.FromSeconds(30),
       
        MaxConnectionsPerServer = 50,
        UseHttp = false // Use HTTPS
    };
    return new AmazonEventBridgeClient(config);
});
var app = builder.Build();

// Configure the HTTP request pipeline
app.UseCors("AllowReactApp"); // Enable CORS
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Rules Engine API v1");
    c.RoutePrefix = string.Empty;
});

// Only use HTTPS redirection in development (and only if HTTPS is configured)
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRouting();
app.UseAuthorization(); // Ensure authorization is after CORS

// Configure endpoints
app.MapControllers();

// Add root endpoint redirect to Swagger
app.MapGet("/", context =>
{
    context.Response.Redirect("/index.html");
    return Task.CompletedTask;
});

// Add health check endpoint
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }));

// Output the URLs the application is running on
if (app.Environment.IsDevelopment())
{
    app.Logger.LogInformation("Application URLs:");
    app.Logger.LogInformation("HTTP: http://localhost:5000");
    app.Logger.LogInformation("HTTPS: https://localhost:5001 (if certificate available)");
    app.Logger.LogInformation("Swagger UI: http://localhost:5000");
}
else
{
    app.Logger.LogInformation("Application running on HTTP: http://localhost:8080");
}

app.Run();