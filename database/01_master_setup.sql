-- =========================================================================
-- BLUE YARD LOGISTICS — COMPLETE DATABASE SETUP (MASTER SCRIPT)
-- =========================================================================

-- 1. SWITCH TO MASTER & RECREATE DATABASE
USE master;
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'BlueYardDB')
BEGIN
    ALTER DATABASE BlueYardDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BlueYardDB;
END
GO

CREATE DATABASE BlueYardDB;
GO

USE BlueYardDB;
GO

-- 2. CREATE TABLES
CREATE TABLE Vessels (
    VesselID VARCHAR(20) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Origin NVARCHAR(100) NOT NULL,
    ArrivalTime DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Arrived'
);
GO

CREATE TABLE Terminals (
    TerminalID VARCHAR(20) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Capacity INT NOT NULL,
    CurrentLoad INT NOT NULL DEFAULT 0
);
GO

CREATE TABLE Warehouses (
    WarehouseID VARCHAR(20) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Capacity INT NOT NULL,
    CurrentLoad INT NOT NULL DEFAULT 0,
    Location NVARCHAR(100) NOT NULL
);
GO

CREATE TABLE Vehicles (
    VehicleID VARCHAR(20) PRIMARY KEY,
    Type NVARCHAR(50) NOT NULL,
    CapacityKg INT NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Available',
    CurrentLocation NVARCHAR(100) NOT NULL
);
GO

CREATE TABLE Routes (
    RouteID INT IDENTITY(1,1) PRIMARY KEY,
    SourceNode NVARCHAR(50) NOT NULL,
    DestinationNode NVARCHAR(50) NOT NULL,
    DistanceKm DECIMAL(6,2) NOT NULL,
    TravelTimeMin INT NOT NULL
);
GO

CREATE TABLE Containers (
    ContainerID VARCHAR(20) PRIMARY KEY,
    VesselID VARCHAR(20) NOT NULL,
    CargoType NVARCHAR(50) NOT NULL,
    WeightKg INT NOT NULL,
    PriorityLevel NVARCHAR(20) NOT NULL,
    Destination NVARCHAR(100) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Manifested',
    PriorityScore INT NULL,
    RiskLevel NVARCHAR(20) NULL,
    ExpectedDwellHours INT NULL,
    AssignedTerminalID VARCHAR(20) NULL,
    AssignedYardSlot VARCHAR(20) NULL,
    AssignedWarehouseID VARCHAR(20) NULL,
    AssignedVehicleID VARCHAR(20) NULL,
    OptimalRoute NVARCHAR(255) NULL,
    TotalRouteDistanceKm DECIMAL(6,2) NULL,
    CONSTRAINT FK_Containers_Vessels FOREIGN KEY (VesselID) REFERENCES Vessels(VesselID),
    CONSTRAINT FK_Containers_Terminals FOREIGN KEY (AssignedTerminalID) REFERENCES Terminals(TerminalID),
    CONSTRAINT FK_Containers_Warehouses FOREIGN KEY (AssignedWarehouseID) REFERENCES Warehouses(WarehouseID),
    CONSTRAINT FK_Containers_Vehicles FOREIGN KEY (AssignedVehicleID) REFERENCES Vehicles(VehicleID)
);
GO

CREATE TABLE YardSlots (
    SlotID VARCHAR(20) PRIMARY KEY,
    TerminalID VARCHAR(20) NOT NULL,
    SlotRow INT NOT NULL,
    SlotColumn INT NOT NULL,
    IsOccupied BIT NOT NULL DEFAULT 0,
    ContainerID VARCHAR(20) NULL,
    CONSTRAINT FK_YardSlots_Terminals FOREIGN KEY (TerminalID) REFERENCES Terminals(TerminalID),
    CONSTRAINT FK_YardSlots_Containers FOREIGN KEY (ContainerID) REFERENCES Containers(ContainerID)
);
GO

CREATE TABLE ContainerHistory (
    HistoryID INT IDENTITY(1,1) PRIMARY KEY,
    ContainerID VARCHAR(20) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    Location NVARCHAR(100) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT GETDATE(),
    Remarks NVARCHAR(255) NULL,
    CONSTRAINT FK_ContainerHistory_Containers FOREIGN KEY (ContainerID) REFERENCES Containers(ContainerID)
);
GO

-- 3. INSERT SEED DATA
-- Vessel
INSERT INTO Vessels (VesselID, Name, Origin, ArrivalTime, Status)
VALUES ('V001', 'MV Ocean Star', 'Dubai', GETDATE(), 'Arrived');

-- Terminals
INSERT INTO Terminals (TerminalID, Name, Type, Capacity, CurrentLoad) VALUES 
('T-A', 'Terminal Alpha', 'General Cargo', 10, 0),
('T-B', 'Terminal Beta', 'Pharma / Priority', 10, 0),
('T-C', 'Terminal Gamma', 'Special Cargo', 10, 0);

-- Yard Slots
INSERT INTO YardSlots (SlotID, TerminalID, SlotRow, SlotColumn, IsOccupied, ContainerID) VALUES 
('TA-R1-C1', 'T-A', 1, 1, 0, NULL),
('TA-R1-C2', 'T-A', 1, 2, 0, NULL),
('TA-R2-C1', 'T-A', 2, 1, 0, NULL),
('TA-R2-C2', 'T-A', 2, 2, 0, NULL),
('TB-R1-C1', 'T-B', 1, 1, 0, NULL),
('TB-R1-C2', 'T-B', 1, 2, 0, NULL),
('TB-R2-C1', 'T-B', 2, 1, 0, NULL),
('TB-R2-C2', 'T-B', 2, 2, 0, NULL),
('TC-R1-C1', 'T-C', 1, 1, 0, NULL),
('TC-R1-C2', 'T-C', 1, 2, 0, NULL),
('TC-R2-C1', 'T-C', 2, 1, 0, NULL),
('TC-R2-C2', 'T-C', 2, 2, 0, NULL);

-- Warehouses
INSERT INTO Warehouses (WarehouseID, Name, Type, Capacity, CurrentLoad, Location) VALUES 
('W1', 'Pharma Vault Central', 'Pharma', 5, 0, 'Lahore Industrial Zone'),
('W2', 'North General Warehouse', 'General Goods', 10, 0, 'Gujranwala Hub'),
('W3', 'Apex Retail Depot', 'Retail/Toys', 8, 0, 'Lahore Commercial Park');

-- Vehicles
INSERT INTO Vehicles (VehicleID, Type, CapacityKg, Status, CurrentLocation) VALUES 
('V1', 'Reefer Truck', 1500, 'Available', 'Port Gate 1'),
('V2', 'Flatbed Truck', 2000, 'Available', 'Port Gate 1'),
('V3', 'Medium Cargo Truck', 1200, 'Available', 'Port Gate 2'),
('V4', 'Heavy Hauler', 3000, 'Available', 'Port Gate 2'),
('V5', 'Light Van', 800, 'Available', 'Port Gate 1');

-- Road Network Graph Routes
INSERT INTO Routes (SourceNode, DestinationNode, DistanceKm, TravelTimeMin) VALUES 
('Port', 'J1', 3.0, 8),   ('J1', 'Port', 3.0, 8),
('Port', 'J2', 5.0, 12),  ('J2', 'Port', 5.0, 12),
('J1', 'J2', 2.0, 5),     ('J2', 'J1', 2.0, 5),
('J1', 'W1', 6.0, 15),    ('W1', 'J1', 6.0, 15),
('J2', 'J3', 4.0, 10),    ('J3', 'J2', 4.0, 10),
('J2', 'W2', 7.0, 18),    ('W2', 'J2', 7.0, 18),
('J3', 'W1', 3.0, 8),     ('W1', 'J3', 3.0, 8),
('J3', 'W3', 5.0, 12),    ('W3', 'J3', 5.0, 12),
('W2', 'W3', 4.5, 11),    ('W3', 'W2', 4.5, 11);

-- Containers (Manifest)
INSERT INTO Containers (ContainerID, VesselID, CargoType, WeightKg, PriorityLevel, Destination, Status) VALUES 
('C001', 'V001', 'Medicine', 800, 'High', 'Lahore', 'Manifested'),
('C002', 'V001', 'Clothing', 1500, 'Normal', 'Gujranwala', 'Manifested'),
('C003', 'V001', 'Toys', 900, 'Normal', 'Lahore', 'Manifested'),
('C004', 'V001', 'Electronics', 1200, 'High', 'Islamabad', 'Manifested'),
('C005', 'V001', 'Stationery', 700, 'Low', 'Gujrat', 'Manifested'),
('C006', 'V001', 'Food', 1100, 'High', 'Lahore', 'Manifested');

-- Initial Audit Log History
INSERT INTO ContainerHistory (ContainerID, Status, Location, Remarks)
SELECT ContainerID, 'Manifested', 'MV Ocean Star', 'Vessel arrived at Port berth. Manifest logged.'
FROM Containers;
GO

-- 4. VERIFY EVERYTHING
SELECT 'Containers Count' AS Metric, COUNT(*) AS Total FROM Containers
UNION ALL
SELECT 'Terminals Count', COUNT(*) FROM Terminals
UNION ALL
SELECT 'Yard Slots Count', COUNT(*) FROM YardSlots
UNION ALL
SELECT 'Warehouses Count', COUNT(*) FROM Warehouses
UNION ALL
SELECT 'Vehicles Count', COUNT(*) FROM Vehicles
UNION ALL
SELECT 'Routes Count', COUNT(*) FROM Routes;
GO