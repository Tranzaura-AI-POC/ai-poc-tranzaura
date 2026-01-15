# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# copy csproj and restore
COPY ./backend/*.csproj ./backend/
RUN dotnet restore ./backend/FleetManagement.csproj

# copy rest and publish
COPY backend/. ./backend/
WORKDIR /src/backend
RUN dotnet publish -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "FleetManagement.dll"]
