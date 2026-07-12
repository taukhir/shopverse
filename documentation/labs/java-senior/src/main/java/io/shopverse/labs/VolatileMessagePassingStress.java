package io.shopverse.labs;

import org.openjdk.jcstress.annotations.*;
import org.openjdk.jcstress.infra.results.I_Result;

@JCStressTest
@Outcome(id = "1", expect = Expect.ACCEPTABLE, desc = "Volatile publication exposes prior data write.")
@State
public class VolatileMessagePassingStress {
    int data; volatile boolean ready;
    @Actor public void writer() { data = 1; ready = true; }
    @Actor public void reader(I_Result result) { while (!ready) Thread.onSpinWait(); result.r1 = data; }
}
