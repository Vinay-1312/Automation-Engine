# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["RulesEngine.Api.csproj", "./"]
RUN dotnet restore

# Copy the rest of the files and build
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy published files from build stage
COPY --from=build /app/publish .

# Configure environment for HTTP only
ENV ASPNETCORE_URLS="http://+:8080"
ENV ASPNETCORE_ENVIRONMENT="Production"
ENV PORT=8080

# Explicitly disable HTTPS requirement
ENV ASPNETCORE_HTTPS_PORT=""
ENV ASPNETCORE_Kestrel__Certificates__Default__Path=""
ENV ASPNETCORE_Kestrel__Certificates__Default__Password=""

EXPOSE 8080

ENTRYPOINT ["dotnet", "RulesEngine.Api.dll"]