# String Analyzer API
A RESTful API  service that analyzer strings and stores their computed properties

## Live Demo



## Features 
- Analyze strings and compute properties:
 - Length
 - Palindrom check
 - Unique character count
 - Word count 
 - SHA256 hash
 - character frequency map
- Retrieve specific strings
- Filter strings using query parameters
- Delete strings
- persistent data storage (LowDB)

## Endpoints 


### 1. POST `/strings`
Analyze a string and save it.
```json
{
  "value": "Hello world"
}
2. GET /strings/{value}
Get analysis of a specific string.

3. GET /strings
Filter strings:
/strings?is_palindrome=true&min_length=5&contains_character=a

4. DELETE /strings/{value}
Delete a specific string.


## Run Locally
git clone 
cd String_Analyzer
npm install
npm start

## Dependencies

express
cors
body-parser
lowdb
crypto

