﻿using EventCartographer.Server.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace EventCartographer.Server.Services.MongoDB
{
    public class MongoDbService
    {
        public IMongoCollection<ActivationCode> ActivationCodes { get; }
        public IMongoCollection<User> Users { get; }
        public IMongoCollection<Marker> Markers { get; }

        public MongoDbService(IOptions<MongoDbSettings> dbSettings)
        {
            var mongoClient = new MongoClient(dbSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(dbSettings.Value.DatabaseName);

            Users = mongoDatabase.GetCollection<User>(dbSettings.Value.UserCollectionName);
            Markers = mongoDatabase.GetCollection<Marker>(dbSettings.Value.MarkerCollectionName);
            ActivationCodes = mongoDatabase.GetCollection<ActivationCode>(dbSettings.Value.ActivationCodeCollectionName);
        }
    }
}
