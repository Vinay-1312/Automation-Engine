package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type McpTask struct {
	TaskID      string            `json:"taskId"`
	Type        string            `json:"type"`
	Parameters  map[string]string `json:"parameters"`
	CallbackURL string            `json:"callbackUrl,omitempty"`
}

func handleRequest(ctx context.Context, sqsEvent events.SQSEvent) error {
	mcpServiceURL := os.Getenv("MCP_SERVICE_URL")
	
	// Process each message from SQS
	for _, message := range sqsEvent.Records {
		var task McpTask
		if err := json.Unmarshal([]byte(message.Body), &task); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		// Send task to MCP service
		client := &http.Client{}
		taskJSON, _ := json.Marshal(task)
		
		req, err := http.NewRequestWithContext(ctx, "POST", mcpServiceURL+"/tasks", nil)
		if err != nil {
			log.Printf("Error creating request: %v", err)
			continue
		}

		req.Header.Set("Content-Type", "application/json")
		
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Error sending request to MCP service: %v", err)
			continue
		}
		
		resp.Body.Close()
	}

	return nil
}

func main() {
	lambda.Start(handleRequest)
}
