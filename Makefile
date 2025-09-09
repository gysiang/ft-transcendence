all : up

up :
	@docker compose -f ./srcs/docker-compose.yml build frontend
	@docker compose -f ./srcs/docker-compose.yml up -d

down :
	@docker compose -f ./srcs/docker-compose.yml down

stop :
	@docker compose -f ./srcs/docker-compose.yml stop

start :
	@docker compose -f ./srcs/docker-compose.yml start

clean:
	@docker compose -f ./srcs/docker-compose.yml down --rmi all -v

status :
	@docker ps -a

logs:
	@docker compose -f ./srcs/docker-compose.yml logs -f

re :
	@docker compose -f ./srcs/docker-compose.yml up -d --build
