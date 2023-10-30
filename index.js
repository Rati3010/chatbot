import dotenv from "dotenv";
import express from "express";
import { createChat, CancelledCompletionError } from "completions";

const app = express();
app.use(express.json());
dotenv.config();
const port = process.env.PORT;

const chat = createChat({
  apiKey: process.env.API_KEY,
  model: "gpt-3.5-turbo-0613",
  functions: [
    {
      name: "sum_of_two_numbers",
      description: "Calculate the sum of two integers",
      parameters: {
        type: "object",
        properties: {
          firstNumber: {
            type: "integer",
            description: "The first integer",
          },
          secondNumber: {
            type: "integer",
            description: "The second integer",
          },
        },
        required: ["firstNumber", "secondNumber"],
      },
      function: async ({ firstNumber, secondNumber }) => {
        const sum = firstNumber + secondNumber;
        return {
          result: sum,
        };
      },
    },
    {
      name: "even_odd_check",
      description: "Check if a number is even or odd",
      parameters: {
        type: "object",
        properties: {
          number: {
            type: "integer",
            description: "The number to check",
          },
        },
        required: ["number"],
      },
      function: async ({ number }) => {
        const isEven = number % 2 === 0;
        return {
          isEven,
        };
      },
    },
    {
      name: "prime_number_check",
      description: "Check if a number is a prime number",
      parameters: {
        type: "object",
        properties: {
          number: {
            type: "integer",
            description: "The number to check",
          },
        },
        required: ["number"],
      },
      function: async ({ number }) => {
        if (number <= 1) {
          return {
            isPrime: false,
          };
        }
        for (let i = 2; i <= Math.sqrt(number); i++) {
          if (number % i === 0) {
            return {
              isPrime: false,
            };
          }
        }
        return {
          isPrime: true,
        };
      },
    },
    {
      name: "get_current_weather",
      description: "Get the current weather in a given location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
          unit: { type: "string", enum: ["celsius", "fahrenheit"] },
        },
        required: ["location"],
      },
      function: async ({ location }) => {
        let res_single = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${Key}&units=metric&sys=unix`
        );
        let data = await res_single.json();
        return {
          location: data.name, //weather api
          temperature: data.main.temp, //weather api
          unit: "celsius",
        };
      },
    },
  ],
  functionCall: "auto",
});

app.get("/", async (req, res) => {
  const message = req.body.question;
  const response = await chat.sendMessage(message);
  console.log(response.content);
  res.send("done");
});

app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});
