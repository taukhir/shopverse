package io.shopverse.labs;

import java.lang.invoke.MethodHandles;
import java.lang.invoke.VarHandle;
import org.openjdk.jcstress.annotations.*;
import org.openjdk.jcstress.infra.results.I_Result;

@JCStressTest
@Outcome(id = "1", expect = Expect.ACCEPTABLE, desc = "Release/acquire publishes data.")
@State
public class AcquireReleaseStress {
    int data; int ready;
    static final VarHandle READY;
    static { try { READY = MethodHandles.lookup().findVarHandle(AcquireReleaseStress.class, "ready", int.class); }
        catch (ReflectiveOperationException e) { throw new ExceptionInInitializerError(e); } }
    @Actor public void writer() { data = 1; READY.setRelease(this, 1); }
    @Actor public void reader(I_Result result) { while ((int) READY.getAcquire(this) == 0) Thread.onSpinWait(); result.r1 = data; }
}
