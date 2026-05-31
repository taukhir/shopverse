package io.shopverse.discovery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication {

	private static final Logger log = LoggerFactory.getLogger(DiscoveryServerApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(DiscoveryServerApplication.class, args);
	}

	@Bean
	ApplicationRunner discoveryServerStarted() {
		return args -> log.info("Discovery server started and ready to serve Eureka registry requests");
	}

}
