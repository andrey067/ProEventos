using Xunit;

// Integration tests spin up WebApplicationFactory hosts with JWKS signing keys.
// Keep them serial so hosts do not contend on shared infrastructure during CI.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
