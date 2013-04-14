#pragma strict

private var SCREEN_HEIGHT:float;
private var SCREEN_WIDTH:float;

private var TOTAL_WIDTH:float;
private var TOTAL_HEIGHT:float;

public var top_left_wall_pref:GameObject;
public var down_door_locked_pref:GameObject;
public var left_door_open_pref:GameObject;
public var top_wall_tile_pref:GameObject;
public var floor_out_1_pref:GameObject;

private var rooms:Array;

private	var EAST:int = 2;
private	var SOUTH:int = 4;
private	var NORTH:int = 8;
private	var WEST:int = 16;
 

function generateRoom(indexX:int, indexY:int, numX:int, numY:int, doorCode:int)
{ 
	var room:GameObject; 
		
	room = new GameObject("room "+ indexX + " " + indexY);
	var roomComp:Room = room.AddComponent(Room);
	
	var corners:Array = roomComp.corners;
	var walls:Array = roomComp.walls;
	var floors:Array = roomComp.floors;
	var doors:Array = roomComp.doors;
	
	var roomTransform:Transform = room.transform;
	
	// wall first
	//left top
	var w : float;
	var h : float; 
	var corner:GameObject;
	corners = new Array();
	
	var myExSprite : exSprite;
	myExSprite = top_left_wall_pref.GetComponent(exSprite);
	w = myExSprite.width;
	h = myExSprite.height;
	corner = Instantiate(top_left_wall_pref);
	corner.transform.position.x = -TOTAL_WIDTH/2 + w/2 ;
	corner.transform.position.y = TOTAL_HEIGHT/2 - h/2;
	corner.transform.parent = roomTransform; 
	corners.Add(corner);
	
	//left bottom rotate 180 degree
	corner = Instantiate(top_left_wall_pref);
	corner.transform.position.x = -TOTAL_WIDTH/2 + w/2;
	corner.transform.position.y = -TOTAL_HEIGHT/2 + h/2;
	corner.GetComponent(exSprite).VFlip();
	corner.transform.parent = roomTransform; 
    corners.Add(corner); 
    
    //right top wall
	corner = Instantiate(top_left_wall_pref);
	corner.transform.position.x = TOTAL_WIDTH/2 - w/2;
	corner.transform.position.y = TOTAL_HEIGHT/2 - h/2;
	corner.GetComponent(exSprite).HFlip();
	corner.transform.parent = roomTransform;  
	corners.Add(corner);
	
	//left bottom rotate 180 degree
	corner = Instantiate(top_left_wall_pref);
	corner.transform.position.x = TOTAL_WIDTH/2 - w/2;
	corner.transform.position.y = - TOTAL_HEIGHT/2 + h/2;
	corner.GetComponent(exSprite).VFlip();
	corner.GetComponent(exSprite).HFlip();
	corner.transform.parent = roomTransform; 
	corners.Add(corner);
	
	var tileW: float;
	var tileH: float;
	var tileNum:int;
	var reminder:float; 
	myExSprite = top_wall_tile_pref.GetComponent(exSprite);
	tileW = myExSprite.width;
	tileH = myExSprite.height;
	tileNum = (TOTAL_WIDTH - w * 2)/tileW;
	reminder =  (TOTAL_WIDTH - w * 2)%tileW;
	reminder = reminder - Mathf.Floor(reminder);
	
	var currPosX:float;
	var currPosY:float;
	
	// TOP FIRST
	walls = new Array();
	currPosY = TOTAL_HEIGHT/2 - tileH/2;  
	currPosX = -TOTAL_WIDTH/2 + w + tileW/2;
	for(var i:int = 0; i < tileNum + 1; i++ )
	{ 
		var wall:GameObject =  Instantiate(top_wall_tile_pref); 
		wall.GetComponent(exSprite).HFlip();
		walls.Add(wall);
		wall.transform.position.x = currPosX;
		wall.transform.position.y = currPosY; 
		wall.transform.position.z = 10;
		wall.transform.parent = roomTransform; 
		currPosX += tileW;
	}
	
	// right
	tileNum = (TOTAL_HEIGHT - h * 2)/tileW;
	reminder =  (TOTAL_HEIGHT - h * 2)%tileW;
	reminder = reminder - Mathf.Floor(reminder);
	currPosY = TOTAL_HEIGHT/2 - h - tileW/2;  
	currPosX = TOTAL_WIDTH/2 - tileH/2;
	for(i = 0; i < tileNum + 1; i++ )
	{ 
		wall =  Instantiate(top_wall_tile_pref); 
		wall.GetComponent(exSprite).HFlip();
		walls.Add(wall);
		wall.transform.position.x = currPosX;
		wall.transform.position.y = currPosY;
		wall.transform.Rotate(0, 0, -90);
		wall.transform.position.z = 10;
		wall.transform.parent = roomTransform; 
		currPosY -= tileW;
	}
	
	 // down
	tileNum = (TOTAL_WIDTH - w * 2)/tileW;
	reminder =  (TOTAL_WIDTH - w * 2)%tileW;
	reminder = reminder - Mathf.Floor(reminder);
	currPosY = - TOTAL_HEIGHT/2 + tileH/2;  
	currPosX = - TOTAL_WIDTH/2 + w + tileW/2;
	for(i = 0; i < tileNum + 1; i++ )
	{ 
		wall =  Instantiate(top_wall_tile_pref); 
		wall.GetComponent(exSprite).VFlip();
		wall.GetComponent(exSprite).HFlip();
		walls.Add(wall);
		wall.transform.position.x = currPosX;
		wall.transform.position.y = currPosY;
		wall.transform.position.z = 10;
		wall.transform.parent = roomTransform; 
		currPosX += tileW;
	}
	
	// left
	tileNum = (TOTAL_HEIGHT - h * 2)/tileW;
	reminder =  (TOTAL_HEIGHT - h * 2)%tileW;
	reminder = reminder - Mathf.Floor(reminder);
	currPosY = TOTAL_HEIGHT/2 - h - tileW/2;  
	currPosX = - TOTAL_WIDTH/2 + tileH/2;
	for(i = 0; i < tileNum + 1; i++ )
	{ 
		wall =  Instantiate(top_wall_tile_pref); 
		wall.GetComponent(exSprite).VFlip();
		wall.GetComponent(exSprite).HFlip();
		walls.Add(wall);
		wall.transform.position.x = currPosX;
		wall.transform.position.y = currPosY;
		wall.transform.Rotate(0, 0, -90);
		wall.transform.position.z = 10;
		wall.transform.parent = roomTransform; 
		currPosY -= tileW;
	}
	
	// put floors
	var tileNumX:int;
	var tileNumY:int;
	var j:int;
	var floor:GameObject;

	myExSprite = floor_out_1_pref.GetComponent(exSprite);
	tileW = myExSprite.width;
	tileH = myExSprite.height;
	tileNumX = (TOTAL_WIDTH - w * 2)/tileW;
	tileNumY = (TOTAL_HEIGHT - h * 2)/tileH;
	reminder =  (TOTAL_WIDTH - h * 2)%tileW;
	reminder = reminder - Mathf.Floor(reminder);
	
	currPosY = TOTAL_HEIGHT/2 - w + tileH/2 + 1;  
	currPosX = - TOTAL_WIDTH/2 + h - tileW/2 - 1;
	floors = new Array();
	for(i = 0; i < numX + 2; i++ )
	{ 
		for(j = 0; j < numY + 2; j++ )
		{
			floor =  Instantiate(floor_out_1_pref); 
			floor.transform.position.x = currPosX + 1;
			floor.transform.position.y = currPosY -1;
			floor.transform.position.z = -1;
			floor.transform.parent = roomTransform; 
			floors.Add(floor);
			currPosY -= tileH;
		}
		currPosX += tileW;
		currPosY = TOTAL_HEIGHT/2 - w + tileH/2 + 1;
	}
	
	// put in doors
	var door:GameObject;
	var doorX:float;
	var doorY:float;
	var doorW:float;
	var doorH:float;
	
	myExSprite = left_door_open_pref.GetComponent(exSprite);
	
	doorW = myExSprite.width; 
	doorH = myExSprite.height;
	doors = new Array();
	
	if (doorCode & EAST)
	{
		doorX =  TOTAL_WIDTH/2 - 16 - doorW/2;
		doorY = 0; 
		door =  Instantiate(left_door_open_pref); 
		door.GetComponent(exSprite).HFlip();
		door.transform.position.x = doorX;
		door.transform.position.y = doorY;
		door.transform.position.z = 5;
		door.transform.parent = roomTransform; 
		doors.Add(door);
	}
			
	if (doorCode & SOUTH)
	{
		doorX = 0;
		doorY = - TOTAL_HEIGHT/2 + 16 + doorW/2; 
		door =  Instantiate(left_door_open_pref); 
		door.transform.position.x = doorX;
		door.transform.position.y = doorY;
		door.transform.Rotate(0, 0, 90); 
		door.transform.position.z = 5;
		door.transform.parent = roomTransform;  
		doors.Add(door);
	}
			
	if (doorCode & WEST) 
	{
		doorX = - TOTAL_WIDTH/2 + 16 + doorW/2;
		doorY = 0; 
		door =  Instantiate(left_door_open_pref); 
		door.transform.position.x = doorX;
		door.transform.position.y = doorY;
		door.transform.position.z = 5;
		door.transform.parent = roomTransform;  
		doors.Add(door);
	}
	
	if (doorCode & NORTH)
	{ 
		doorX = 0;
		doorY = TOTAL_HEIGHT/2 - 16 - doorW/2; 
		door =  Instantiate(left_door_open_pref); 
		door.transform.position.x = doorX;
		door.transform.position.y = doorY;
		door.transform.Rotate(0, 0, -90); 
		door.transform.position.z = 5;
		door.transform.parent = roomTransform;  
		doors.Add(door);
	}
	
	roomTransform.position.x = SCREEN_WIDTH * indexX;
	roomTransform.position.y = SCREEN_HEIGHT * indexY;
	rooms.Add(room);
}

var currIdxX:int = 0;
var currIdxY:int = 0;
var lastDoorDirc:int = 0;
var level:int = 0;
function rollRooms(nx:int, ny:int, distance:int)
{
	// start to build room
	// out base room should random a door
	var sequence:Array = new Array(2, 4, 8, 16);
	
	if (lastDoorDirc != 0)
	{
		for (var i :int = 0; i < sequence.length; i++)
		{
			if (sequence[i] == lastDoorDirc)
			{
				sequence.RemoveAt(i);
			}
		}
	}
	
	var r:int;
	
	// pick a door depends direction
	r = Random.RandomRange(0, sequence.length);
	var doorDirct:int = sequence[r];
	Debug.Log("doorDirect: " + doorDirct);
	
	
	if (level == distance)
	{
		generateRoom(currIdxX, currIdxY, nx, ny, lastDoorDirc);
		return;
	}
	else
	{	
		Debug.Log("generate");
		Debug.Log("currIndexX: " + currIdxX);
		Debug.Log("currIndexY: " + currIdxY);
		generateRoom(currIdxX, currIdxY, nx, ny, doorDirct + lastDoorDirc);
	}
	
	level += 1;
	Debug.Log("pre");
	Debug.Log("currIndexX: " + currIdxX);
	Debug.Log("currIndexY: " + currIdxY);
	
	if (doorDirct & EAST)
	{
		currIdxX += 1;
		lastDoorDirc = WEST;
	}
	
	if (doorDirct & SOUTH)
	{
		currIdxY -= 1;
		lastDoorDirc = NORTH;
	}
	
	if (doorDirct & WEST)
	{
		currIdxX -= 1;
		lastDoorDirc = EAST;
	}
	
	if (doorDirct & NORTH)
	{
		currIdxY += 1;
		lastDoorDirc = SOUTH;
	}
	
	Debug.Log("after");
	Debug.Log("currIndexX: " + currIdxX);
	Debug.Log("currIndexY: " + currIdxY);
	
	rollRooms(nx, ny, distance);
}


function Start () { 
	var ASR:float;
	// left top corner
	var w1:float; 
	var h1:float; 
	// flooar 
	// w3 equal to h3
	var w3:float;
	// total width
	var wTotal:float; 
	var hTotal:float;
	
	SCREEN_WIDTH = Screen.width;
	SCREEN_HEIGHT = Screen.height;
	
	ASR = SCREEN_WIDTH/SCREEN_HEIGHT; 
	Debug.Log("asr" + ASR);
	SCREEN_HEIGHT = Camera.main.orthographicSize * 2;
	SCREEN_WIDTH =  SCREEN_HEIGHT * ASR;
	
	Debug.Log("SCREEN_WIDTH: " + SCREEN_WIDTH);
	Debug.Log("SCREEN_HEIGHT: " + SCREEN_HEIGHT);
	
	var myExSprite : exSprite;
	myExSprite = top_left_wall_pref.GetComponent(exSprite);
	w1 = myExSprite.width;
	h1 = myExSprite.height;
	myExSprite = floor_out_1_pref.GetComponent(exSprite);
	w3 = myExSprite.width; 
	
	var nx:int;
	var ny:int;
	nx = Mathf.Floor((SCREEN_WIDTH - 2 * w1)/w3 ) ;
	ny = Mathf.Floor((SCREEN_HEIGHT - 2 * w1)/w3 );
	
	Debug.Log("nx: " + nx);
	Debug.Log("ny: " + ny);
	
	wTotal = w3 * nx + w1 * 2;
	hTotal = w3 * ny + h1 * 2;
	 
	Debug.Log("TOTAL_WIDTH: " + wTotal);
	Debug.Log("TOTAL_HEIGHT: " + hTotal); 
	 
	TOTAL_WIDTH = wTotal;
	TOTAL_HEIGHT = hTotal;
	 
	rooms = new Array();
	
	rollRooms(nx, ny, 10);

}

function Update () {

}