# ft-transcendence

Notion - https://www.notion.so/FT-Transcendence-22620305a78e806693c1c70ff49169ec

FrontEnd
- cd website
- npm install
- npm run dev

Backend
- docker build -t pong-backend .
- docker run -p 3000:3000 pong-backend
- curl or visit http://localhost:3000/api/hello

Stop and remove container
docker stop $(docker ps -qa); docker rm $(docker ps -qa); docker rmi -f $(docker images -qa); docker volume rm $(docker volume ls -q); docker network rm $(docker network ls -q) 2>/dev/null

