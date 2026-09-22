import os
from dotenv import load_dotenv
from azure.identity import AzureCliCredential
from azure.ai.projects import AIProjectClient

load_dotenv()

endpoint = os.getenv("FOUNDRY_PROJECT_ENDPOINT")
deployment = os.getenv("FOUNDRY_MODEL_DEPLOYMENT")

print("Endpoint:", endpoint)
print("Deployment:", deployment)

credential = AzureCliCredential()

project_client = AIProjectClient(endpoint=endpoint, credential=credential)

print("Foundry client created successfully!")

with project_client.inference.get_azure_openai_client(
    api_version="2024-10-21"
) as client:

    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {
                "role": "user",
                "content": "Say hello and confirm the model deployment you are using.",
            }
        ],
    )

    print("\nAI RESPONSE:")
    print(response.choices[0].message.content)
