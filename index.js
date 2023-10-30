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
    {
      name: "translate_text",
      description: "Translate text from one language to another",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The text to translate",
          },
          sourceLanguage: {
            type: "string",
            description: "The source language code (e.g., 'en' for English)",
          },
          targetLanguage: {
            type: "string",
            description: "The target language code (e.g., 'fr' for French)",
          },
        },
        required: ["text", "sourceLanguage", "targetLanguage"],
      },
      function: async ({ text, sourceLanguage, targetLanguage }) => {
        // Use a language translation API (e.g., Google Translate) to perform the translation
        const translationResult = await performTranslation(
          text,
          sourceLanguage,
          targetLanguage
        );
        return {
          translatedText: translationResult,
        };
      },
    },
    {
      name: "unit_conversion",
      description: "Convert units from one measurement to another",
      parameters: {
        type: "object",
        properties: {
          value: {
            type: "number",
            description: "The value to convert",
          },
          fromUnit: {
            type: "string",
            description: "The source unit (e.g., 'meters')",
          },
          toUnit: {
            type: "string",
            description: "The target unit (e.g., 'feet')",
          },
        },
        required: ["value", "fromUnit", "toUnit"],
      },
      function: async ({ value, fromUnit, toUnit }) => {
        const convertedValue = performUnitConversion(value, fromUnit, toUnit);
        return {
          result: convertedValue,
        };
      },
    },
    {
        name: "currency_conversion",
        description: "Convert currency from one currency to another",
        parameters: {
          type: "object",
          properties: {
            amount: {
              type: "number",
              description: "The amount to convert",
            },
            fromCurrency: {
              type: "string",
              description: "The source currency code (e.g., 'USD')",
            },
            toCurrency: {
              type: "string",
              description: "The target currency code (e.g., 'EUR')",
            },
          },
          required: ["amount", "fromCurrency", "toCurrency"],
        },
        function: async ({ amount, fromCurrency, toCurrency }) => {
          // Implement currency conversion logic using an exchange rate API
          const convertedAmount = await performCurrencyConversion(amount, fromCurrency, toCurrency);
          return {
            result: convertedAmount,
          };
        },
      }      
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
