namespace backend.Algorithms
{
    public class GraphEdge
    {
        public string TargetNode { get; set; } = string.Empty;
        public decimal DistanceKm { get; set; }
        public int TravelTimeMin { get; set; }

        public GraphEdge(string targetNode, decimal distanceKm, int travelTimeMin)
        {
            TargetNode = targetNode;
            DistanceKm = distanceKm;
            TravelTimeMin = travelTimeMin;
        }
    }

    public class TransportGraph
    {
        // Adjacency List: NodeName -> List of connected Edges
        public Dictionary<string, List<GraphEdge>> AdjacencyList { get; private set; }

        public TransportGraph()
        {
            AdjacencyList = new Dictionary<string, List<GraphEdge>>(StringComparer.OrdinalIgnoreCase);
        }

        public void AddNode(string node)
        {
            if (!AdjacencyList.ContainsKey(node))
            {
                AdjacencyList[node] = new List<GraphEdge>();
            }
        }

        public void AddEdge(string source, string destination, decimal distanceKm, int travelTimeMin)
        {
            AddNode(source);
            AddNode(destination);

            AdjacencyList[source].Add(new GraphEdge(destination, distanceKm, travelTimeMin));
        }
    }
}