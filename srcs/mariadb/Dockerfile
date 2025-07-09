FROM mariadb:11.8.2

COPY ./tools/init.sql /docker-entrypoint-initdb.d/

COPY ./tools/00-init.sh /docker-entrypoint-initdb.d/

COPY ./conf/50-server.cnf /etc/mysql/mariadb.conf.d/

RUN chmod +x /docker-entrypoint-initdb.d/00-init.sh

RUN chown -R mysql:mysql /docker-entrypoint-initdb.d

EXPOSE 3306
