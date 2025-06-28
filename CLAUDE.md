# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a full-stack data breach management system with:
- The BreachAPI exposes 2 api endpoints, both of which accept optional from and to dates. 
- There is a BreachApi.Tests xUnit test Project
- There is a Breach.sln solution file, which includes BreachApi and BreachApi.Tests
- The api calls https://haveibeenpwned.com/api/v3/breaches to retrieve a list of breaches, and applies filtering and orders by date descending.
- The angular app creates an user interface for exposing these 2 API's via an UI to the end user.
- **Backend**: .NET 9.0 ASP.NET Core Web API (`BreachApi/`)
  - /api/breach
  - /api/breach/pdf
  
- **Frontend**: Angular 20 application (`breach-viewer/`)

## C# preferences
- If an .gitignore file does not exist, add one 
- Use Flurl.http for making REST API calls
- Use Mediatr with CQRS
- Prefer Global exception handlers
- Use Microsoft.Extensions.Logging for logging
- Use Handlebars.net for converting json to html
- Use Puppetter for html to pdf conversion
- Add tests and use nsubstitute for mocking
- Do not use any nuget packages which require commercial license (like FluentAssertions)


## Angular preferences
- If an .gitignore file does not exist, add one 
- Use industry best practices for Angular usage
- Make the angular app response with a modern look and feed

