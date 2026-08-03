package io.shopverse.labs;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.StreamSupport;
import javax.tools.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CoreJavaScenariosTest {
    @Test void wideningBeatsBoxingAndVarargs() { assertEquals("long", CoreLanguageScenarios.choose(1)); }
    @Test void staticHidingUsesReferenceTypeButOverrideUsesObject() {
        CoreLanguageScenarios.Parent value=new CoreLanguageScenarios.Child();
        assertEquals("parent", value.hidden()); assertEquals("child", value.override());
    }
    @Test void mutableMapKeyBreaksLookup() {
        final class Key { int id; Key(int id){this.id=id;} public boolean equals(Object o){return o instanceof Key k&&k.id==id;} public int hashCode(){return id;} }
        Key key=new Key(1);Map<Key,String> map=new HashMap<>();map.put(key,"value");key.id=2;assertNull(map.get(key));
    }
    @Test void comparatorZeroControlsTreeUniqueness() {
        record Product(String sku,String name){} var set=new TreeSet<Product>(Comparator.comparing(Product::sku));
        set.add(new Product("A","one"));set.add(new Product("A","two"));assertEquals(1,set.size());
    }
    @Test void forkJoinAndCustomSpliteratorProduceExpectedResults() {
        long[] values={1,2,3,4,5};assertEquals(15,ForkJoinPool.commonPool().invoke(new ForkJoinSumLab(values,0,values.length,2)));
        assertEquals(45,StreamSupport.intStream(new RangeSpliterator(0,10),true).sum());
    }
    @Test void returnTypeAloneCannotOverload() {
        String source="class Broken { int x(){return 1;} long x(){return 1;} }";
        JavaCompiler compiler=ToolProvider.getSystemJavaCompiler();
        JavaFileObject file=new SimpleJavaFileObject(URI.create("string:///Broken.java"),JavaFileObject.Kind.SOURCE){public CharSequence getCharContent(boolean ignored){return source;}};
        assertFalse(compiler.getTask(null,null,null,List.of("-proc:none"),null,List.of(file)).call());
    }
}
