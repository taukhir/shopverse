# Java Senior Labs

Executable evidence for the architect Java track. Use JDK 24 and Maven 3.9+.

```powershell
mvn test
mvn -DskipTests package
java -cp target/classes io.shopverse.labs.ThreadPoolSaturationLab
java -Djdk.tracePinnedThreads=full -cp target/classes io.shopverse.labs.VirtualThreadPinningLab
java -XX:NativeMemoryTracking=summary -cp target/classes io.shopverse.labs.DirectMemoryPressureLab 64
jcmd <pid> VM.native_memory summary
```

Run benchmarks through the generated JMH runner from your IDE or add an uber-jar
profile locally. Never compare results from debug/IDE runs. Record JDK, OS, CPU,
forks, warm-up, measurement, GC and profiler settings.

Safety: pressure labs default to bounded allocations and terminate. Increase
arguments only in an isolated development environment with explicit process
memory limits.

CI runs Maven compilation and tests on JDK 24 and 25. Keep release-specific APIs
compatible with both matrix entries or isolate them behind an explicit profile.
