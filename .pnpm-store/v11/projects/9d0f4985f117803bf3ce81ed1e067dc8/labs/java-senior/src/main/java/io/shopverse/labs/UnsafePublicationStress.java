package io.shopverse.labs;

import org.openjdk.jcstress.annotations.*;
import org.openjdk.jcstress.infra.results.II_Result;

@JCStressTest
@Outcome(id = "1, 1", expect = Expect.ACCEPTABLE, desc = "Published state observed.")
@Outcome(id = "0, 0", expect = Expect.ACCEPTABLE, desc = "Reader ran before publication.")
@Outcome(expect = Expect.ACCEPTABLE_INTERESTING, desc = "Race exposed an intermediate observation.")
@State
public class UnsafePublicationStress {
    int data; boolean ready;
    @Actor public void writer() { data = 1; ready = true; }
    @Actor public void reader(II_Result result) { result.r1 = ready ? 1 : 0; result.r2 = data; }
}
