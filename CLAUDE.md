# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a full-stack data breach management system with:
- **Backend**: .NET 9.0 ASP.NET Core Web API (`BreachApi/`)
- **Frontend**: Angular 20 application (`breach-viewer/`)
- The BreachAPI exposes 2 api endpoints, both of which accept optional from and to dates. (/api/breaches and /api/breaches/pdf).
- The api calls https://haveibeenpwned.com/api/v3/breaches to retrieve a list of breaches, and applies filtering and orders by date descending.
- The angular app creates an user interface for exposing these 2 API's via an UI to the end user.

## C# preferences
- Use Flurl.http for making REST API calls
- Use Mediatr with CQRS
- Prefer Global exception handlers
- Use Microsoft.Extensions.Logging for logging

## Angular preferences
- Use industry best practices for Angular usage
