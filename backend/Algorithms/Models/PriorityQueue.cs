namespace backend.Algorithms
{
    // A clean, generic Max-Priority Queue implemented using a binary heap
    public class CustomPriorityQueue<T>
    {
        private class Node
        {
            public T Data { get; set; }
            public int Priority { get; set; }

            public Node(T data, int priority)
            {
                Data = data;
                Priority = priority;
            }
        }

        private readonly List<Node> _elements = new List<Node>();

        public int Count => _elements.Count;
        public bool IsEmpty => _elements.Count == 0;

        // Enqueue: Inserts element and bubbles it up to maintain Max-Heap property
        public void Enqueue(T item, int priority)
        {
            var node = new Node(item, priority);
            _elements.Add(node);

            int childIndex = _elements.Count - 1;
            while (childIndex > 0)
            {
                int parentIndex = (childIndex - 1) / 2;

                // Max-Heap: Parent priority must be >= Child priority
                if (_elements[childIndex].Priority <= _elements[parentIndex].Priority)
                    break;

                // Swap child and parent
                var temp = _elements[childIndex];
                _elements[childIndex] = _elements[parentIndex];
                _elements[parentIndex] = temp;

                childIndex = parentIndex;
            }
        }

        // Dequeue: Removes and returns the highest priority element
        public T Dequeue()
        {
            if (IsEmpty)
                throw new InvalidOperationException("Priority Queue is empty.");

            T rootItem = _elements[0].Data;
            int lastIndex = _elements.Count - 1;

            _elements[0] = _elements[lastIndex];
            _elements.RemoveAt(lastIndex);

            // Bubble down
            int parentIndex = 0;
            while (true)
            {
                int leftChild = 2 * parentIndex + 1;
                int rightChild = 2 * parentIndex + 2;
                int largest = parentIndex;

                if (leftChild < _elements.Count && _elements[leftChild].Priority > _elements[largest].Priority)
                {
                    largest = leftChild;
                }

                if (rightChild < _elements.Count && _elements[rightChild].Priority > _elements[largest].Priority)
                {
                    largest = rightChild;
                }

                if (largest == parentIndex)
                    break;

                var temp = _elements[parentIndex];
                _elements[parentIndex] = _elements[largest];
                _elements[largest] = temp;

                parentIndex = largest;
            }

            return rootItem;
        }

        public T Peek()
        {
            if (IsEmpty)
                throw new InvalidOperationException("Priority Queue is empty.");

            return _elements[0].Data;
        }
    }
}