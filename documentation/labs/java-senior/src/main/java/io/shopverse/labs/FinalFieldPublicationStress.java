package io.shopverse.labs;

import org.openjdk.jcstress.annotations.*;
import org.openjdk.jcstress.infra.results.I_Result;

@JCStressTest
@Outcome(id = "-1", expect = Expect.ACCEPTABLE, desc = "Reader ran before publication.")
@Outcome(id = "42", expect = Expect.ACCEPTABLE, desc = "Final field observed initialized.")
@State
public class FinalFieldPublicationStress {
    static final class Holder { final int value; Holder() { value = 42; } }
    Holder holder;
    @Actor public void writer() { holder = new Holder(); }
    @Actor public void reader(I_Result result) { Holder h = holder; result.r1 = h == null ? -1 : h.value; }
}
