using backend.Algorithms.Models;

namespace backend.Algorithms
{
    public class DijkstraRouter
    {
        /// <summary>
        /// Computes the shortest path from startNode to targetNode using Dijkstra's Algorithm.
        /// </summary>
        public static RouteResult? FindShortestPath(TransportGraph graph, string startNode, string targetNode)
        {
            if (!graph.AdjacencyList.ContainsKey(startNode) || !graph.AdjacencyList.ContainsKey(targetNode))
                return null;

            var distances = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            var travelTimes = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var previousNodes = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            var unvisited = new HashSet<string>(graph.AdjacencyList.Keys, StringComparer.OrdinalIgnoreCase);

            foreach (var node in graph.AdjacencyList.Keys)
            {
                distances[node] = decimal.MaxValue;
                travelTimes[node] = int.MaxValue;
                previousNodes[node] = null;
            }

            distances[startNode] = 0;
            travelTimes[startNode] = 0;

            while (unvisited.Count > 0)
            {
                // Find unvisited node with smallest distance
                string? current = null;
                decimal minDistance = decimal.MaxValue;

                foreach (var node in unvisited)
                {
                    if (distances[node] < minDistance)
                    {
                        minDistance = distances[node];
                        current = node;
                    }
                }

                if (current == null || distances[current] == decimal.MaxValue)
                    break; // Remaining nodes are unreachable

                if (current.Equals(targetNode, StringComparison.OrdinalIgnoreCase))
                    break; // Target reached

                unvisited.Remove(current);

                foreach (var edge in graph.AdjacencyList[current])
                {
                    if (!unvisited.Contains(edge.TargetNode))
                        continue;

                    decimal alternativeDistance = distances[current] + edge.DistanceKm;
                    if (alternativeDistance < distances[edge.TargetNode])
                    {
                        distances[edge.TargetNode] = alternativeDistance;
                        travelTimes[edge.TargetNode] = travelTimes[current] + edge.TravelTimeMin;
                        previousNodes[edge.TargetNode] = current;
                    }
                }
            }

            // Path Reconstruction
            if (distances[targetNode] == decimal.MaxValue)
                return null; // No path found

            var path = new List<string>();
            string? curr = targetNode;
            while (curr != null)
            {
                path.Insert(0, curr);
                curr = previousNodes[curr];
            }

            return new RouteResult
            {
                PathNodes = path,
                TotalDistanceKm = distances[targetNode],
                EstimatedTravelTimeMin = travelTimes[targetNode]
            };
        }
    }
}