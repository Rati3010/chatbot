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
          location: data.name,
          temperature: data.main.temp,
          unit: "celsius",
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
        function performUnitConversion(value, fromUnit, toUnit) {
          const conversionFactors = {
            length: {
              meters: {
                feet: 3.28084,
                yards: 1.09361,
              },
              feet: {
                meters: 0.3048,
                yards: 0.333333,
              },
              yards: {
                meters: 0.9144,
                feet: 3,
              },
            },
            weight: {
              kilograms: {
                pounds: 2.20462,
                grams: 1000,
              },
              pounds: {
                kilograms: 0.453592,
                grams: 453.592,
              },
              grams: {
                kilograms: 0.001,
                pounds: 0.00220462,
              },
            },
            temperature: {
              celsius: {
                fahrenheit: (celsius) => (celsius * 9) / 5 + 32,
              },
              fahrenheit: {
                celsius: (fahrenheit) => ((fahrenheit - 32) * 5) / 9,
              },
            },
          };

          if (
            !conversionFactors[fromUnit] ||
            !conversionFactors[fromUnit][toUnit]
          ) {
            return "Invalid units for conversion.";
          }

          if (typeof conversionFactors[fromUnit][toUnit] === "function") {
            const convertedValue = conversionFactors[fromUnit][toUnit](value);
            return convertedValue;
          } else {
            const conversionFactor = conversionFactors[fromUnit][toUnit];
            const convertedValue = value * conversionFactor;
            return convertedValue;
          }
        }

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
        const exchangeRates = {
          USD: 1,
          EUR: 0.85,
          GBP: 0.75,
          JPY: 110,
          AUD: 1.3,
          CAD: 1.25,
          INR: 75,
          CNY: 6.5,
          MXN: 20,
          AED: 3.67,
          BRL: 5.39,
          ZAR: 14.55,
          SAR: 3.75,
          SEK: 8.77,
          CHF: 0.92,
          NZD: 1.44,
          SGD: 1.33,
          HKD: 7.77,
          RUB: 74.6,
          KRW: 1173,
          TRY: 14.2,
        };

        function performCurrencyConversion(amount, fromCurrency, toCurrency) {
          if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
            return "Invalid currency codes for conversion.";
          }
          const convertedAmount =
            (amount / exchangeRates[fromCurrency]) * exchangeRates[toCurrency];
          return convertedAmount;
        }

        const convertedAmount = await performCurrencyConversion(
          amount,
          fromCurrency,
          toCurrency
        );
        return {
          result: convertedAmount,
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
